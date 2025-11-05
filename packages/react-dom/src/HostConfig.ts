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

export const scheduleTimeout: any = typeof setTimeout === 'function' ? setTimeout : undefined;
const localPromise = typeof Promise === 'function' ? Promise : undefined;

export const scheduleMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof localPromise === 'function'
      ? (callback: any) => localPromise.resolve().then(callback).catch(handleErrorInNextTick)
      : scheduleTimeout;

function handleErrorInNextTick(error: any) {
  setTimeout(() => {
    throw error;
  });
}
