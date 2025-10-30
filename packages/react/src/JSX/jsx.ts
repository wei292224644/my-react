import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
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
