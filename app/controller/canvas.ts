import { Controller } from "egg";
import { paramsVal } from "./../types/canvas";
import canvasHandle from "./../utils/canvas";
import zipHandle from "./../utils/zip";

export default class CanvasController extends Controller {
  public async index() {
    const { ctx } = this;
    try {
      const params: paramsVal = ctx.request.body;
      // 调用canvas方法，生成图片
      const result = await canvasHandle.init(params);
      // 判断返回值
      if (result.status === 1) {
        // 判断是否需要压缩文件
        if (params.zip) {
          const zipResult = zipHandle(
            params.zipName,
            result.data.imgFolderName,
            params.deleteFolder
          );
          if (zipResult) {
            // 返回成功信息
            ctx.body = {
              zip: zipResult,
              ...result.data
            };
            return;
          }
          ctx.body = {
            code: -1,
            data: "",
            msg: "文件压缩失败"
          };
          return;
        }
        // 返回成功信息
        ctx.body = {
          code: 0,
          data: result.data,
          msg: "success"
        };
      } else {
        // 图片加载错误，输出错误信息
        ctx.body = {
          code: -1,
          data: "",
          msg: result.msg
        };
      }
    } catch (error) {
      // ctx.response.status = 500;
      ctx.body = error;
    }
  }
}
