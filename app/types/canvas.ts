/**
 * list数组的数据类型
 *
 * @interface listVal
 */
export interface listVal {
  type: string; // 类型： text（文本），img(图片)
  text?: string; // 文本内容，当type：text时，text需传入，默认为空字符串
  fontSize?: number; // 文本字体大小，当type：text时，fontSize需传入，默认为16px
  imgSrc?: string; // 网络图片地址，仅支持http
  w?: number; // 设置图片宽度， 默认原大小
  h?: number; // 图片高度， 默认原大小
  x: number; // x轴相对位置，具体看图示
  y: number; // y轴相对位置，具体看图示
}

/**
 * data数组的数据类型
 *
 * @export
 * @interface dataVal
 */
export interface dataVal {
  fileName: string;
  list: listVal[];
}

/**
 * 请求参数的数据类型
 *
 * @export
 * @interface payloadVal
 */
export interface paramsVal {
  zip?: boolean; // 是否需要打包压缩图片, 默认false
  zipName?: string; // 压缩文件名称
  deleteFolder?: boolean;
  bgSrc: string; // 画布的背景图片，背景图片决定画布的尺寸大小
  fontFamily?: string; // 字体类型
  data: dataVal[];
}
