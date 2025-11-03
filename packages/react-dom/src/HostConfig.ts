export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: any): Container => {
  //TODO: 处理props
  console.log('createInstance', type, props);
  const element = document.createElement(type);
  return element;
};

export const createTextInstance = (content: string) => {
  console.log('createTextInstance', content);
  return document.createTextNode(content);
};

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
  console.log('appendInitialChild', parent, child);
  parent.appendChild(child);
};

export const appendChildToContainer = appendInitialChild;

export const commitTextUpdate = (textInstance: TextInstance, content: string) => {
  textInstance.textContent = content;
};

export const removeChild = (child: Instance | TextInstance, container: Container) => {
  container.removeChild(child);
};
