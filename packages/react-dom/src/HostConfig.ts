import { updateFiberProps } from './SyntheticEvent';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: any): Container => {
  const element = document.createElement(type);
  updateFiberProps(element, props);
  return element;
};

export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
};

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
  parent.appendChild(child);
};

export const appendChildToContainer = appendInitialChild;

export const commitTextUpdate = (textInstance: TextInstance, content: string) => {
  textInstance.textContent = content;
};

export const removeChild = (child: Instance | TextInstance, container: Container) => {
  container.removeChild(child);
};

export const insertChildToContainer = (
  child: Instance | TextInstance,
  container: Container,
  before: Instance | TextInstance
) => {
  container.insertBefore(child, before);
};
