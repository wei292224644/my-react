import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType, Type, Key, Ref, Props, ElementType } from 'shared/ReactTypes';

const ReactElement = function (type: Type, key: Key, ref: Ref, props: Props): ReactElementType {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'wj'
  };

  console.log(element);

  return element;
};

export const jsx = (type: ElementType, config: any, ...maybeChildren: any[]): ReactElementType => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];

    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val;
      }
      continue;
    }

    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }

  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength === 1) {
    props.children = maybeChildren[0];
  } else if (maybeChildrenLength > 1) {
    props.children = maybeChildren;
  }

  return ReactElement(type, key, ref, props);
};

export const jsxDEV = (type: ElementType, config: any, key: Key): ReactElementType => {
  console.log('创建元素', { type, config });

  //FIXME: 这里添加了 key 之后，导致 element 针对数组类型的 children 更新出现了问题,需要排查原因
  //大概率出现在reconcileChildrenArray函数中

  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];

    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }

    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }

  return ReactElement(type, key, ref, props);
};

export const Fragment = REACT_FRAGMENT_TYPE;
