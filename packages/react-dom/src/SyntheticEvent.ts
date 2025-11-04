import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '__react_element_props__';

export interface DOMElement extends Element {
  [elementPropsKey]?: Props;
}

interface SyntheticEvent extends Event {
  __stopPropagation: boolean;
}

type EventCallback = (event: Event) => void;
interface Paths {
  capture: EventCallback[];
  bubble: EventCallback[];
}

export const updateFiberProps = (node: DOMElement, props: Props) => {
  node[elementPropsKey] = props;
};

const validEventTypeList = ['click'];

export const initEvent = (container: DOMElement, eventType: string) => {
  if (!validEventTypeList.includes(eventType)) {
    console.warn('当前不支持此事件的监听', eventType);
    return;
  }

  if (__DEV__) {
    console.log('初始化事件', eventType);
  }

  container.addEventListener(eventType, (e) => {
    dispatchEvent(container, eventType, e);
  });
};

const createSyntheticEvent = (nativeEvent: Event) => {
  const syntheticEvent = nativeEvent as SyntheticEvent;
  syntheticEvent.__stopPropagation = false;

  const originStopPropagation = nativeEvent.stopPropagation;

  syntheticEvent.stopPropagation = () => {
    syntheticEvent.__stopPropagation = true;
    if (originStopPropagation) {
      originStopPropagation.call(nativeEvent);
    }
  };
  return syntheticEvent;
};

const dispatchEvent = (container: DOMElement, eventType: string, event: Event) => {
  if (__DEV__) {
    console.log('派发事件', eventType, event);
  }

  const targetElement = event.target as DOMElement | null;

  if (targetElement === null) {
    console.warn('事件不存在目标元素');
    return;
  }

  const { bubble, capture } = collectPaths(targetElement, container, eventType);

  const se = createSyntheticEvent(event);

  triggerEventFlow(capture, se);

  if (!se.__stopPropagation) {
    triggerEventFlow(bubble, se);
  }
};

const triggerEventFlow = (eventCallbackList: EventCallback[], syntheticEvent: SyntheticEvent) => {
  for (let i = 0; i < eventCallbackList.length; i++) {
    const eventCallback = eventCallbackList[i];
    eventCallback.call(null, syntheticEvent);
    if (syntheticEvent.__stopPropagation) {
      break;
    }
  }
};

const getEventCallbackNameFromEventType = (eventType: string) => {
  return {
    click: ['onClickCapture', 'onClick']
  }[eventType];
};

const collectPaths = (targetElement: DOMElement, container: DOMElement, eventType: string) => {
  const paths: Paths = {
    capture: [],
    bubble: []
  };

  while (targetElement && targetElement !== container) {
    const props = targetElement[elementPropsKey];

    if (props) {
      const callbackNameList = getEventCallbackNameFromEventType(eventType);

      if (callbackNameList) {
        callbackNameList.forEach((callbackName, i) => {
          const eventCallback = props[callbackName];

          if (eventCallback) {
            if (i === 0) {
              //capture
              paths.capture.unshift(eventCallback);
            } else {
              //bubble
              paths.bubble.push(eventCallback);
            }
          }
        });
      }
    }
    targetElement = targetElement.parentNode as DOMElement;
  }
  return paths;
};
