"use strict";
import { createCanvas, Image, registerFont } from "canvas";
import { listVal, paramsVal } from "./../types/canvas";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

class CanvasHandle {
  /**
   * 加载canvas画布
   *
   * @param {string} [bgSrc=""]
   * @param {dataVal[]} data
   * @param {string} [fontFamily="weiruanyahei"]
   * @param {string} [zipName=""]
   * @returns
   * @memberof CanvasHandle
   */
  async init(params: paramsVal) {
    try {
      const { bgSrc = "", data = [], fontFamily = "weiruanyahei" } = params;
      const imgPathList: string[] = [];
      // 当前图片文件夹名称
      const imgFolderName = `${Date.now().valueOf()}`;
      // 遍历图片信息
      for (const arr of data) {
        const { ctx, canvas } = await this.initBgImgAndFonts(bgSrc, fontFamily);
        for (const item of arr.list) {
          switch (item.type) {
            case "text":
              await this.drawFont(ctx, item);
              break;
            case "img":
              await this.publicImg(ctx, item);
              break;
            default:
              break;
          }
        }
        await this.createFile(canvas, arr.fileName, imgFolderName);
        imgPathList.push(`/public/${imgFolderName}/${arr.fileName}.png`);
      }
      return {
        status: 1,
        data: {
          imgFolderName,
          imgPathList
        },
        msg: "success"
      };
    } catch (error) {
      return {
        ...error
      };
    }
  }
  /**
   * 加载网络图片
   *
   * @param {string} [url=""] 当url为空字符串时，返回错误
   * @returns
   * @memberof CanvasHandle
   */
  async loadImg(url: string = "") {
    const loadingHandle = (url = "") => {
      if (url === "") {
        return "图片地址不能为空";
      }
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            status: 1,
            img,
            msg: ""
          });
        };
        img.onerror = () =>
          reject({
            status: 0,
            msg: `${url}图片加载失败`
          });
        http.get(url, res => {
          if (res.statusCode === 200) {
            const chunks = [];
            res.on("error", (err: any) => {
              reject(err);
            });
            res.on("data", (chunk: never) => {
              chunks.push(chunk);
            });
            res.on("end", () => {
              img.src = Buffer.concat(chunks);
            });
          } else {
            reject({
              status: 0,
              msg: `${url}图片加载失败`
            });
          }
        });
      });
    };
    const result: any = await loadingHandle(url);
    if ((result.status = 1)) {
      return result.img;
    } else {
      new Error(result.msg);
    }
  }
  /**
   * 加载背景图和默认字体
   *
   * @param {string} [url=""]
   * @param {string} [fontFamily=""]
   * @returns
   * @memberof CanvasHandle
   */
  async initBgImgAndFonts(url: string = "", fontFamily: string = "") {
    if (url === "") {
      return "图片地址不能为空";
    }
    try {
      registerFont(path.join(__dirname, `../public/fonts/${fontFamily}.ttf`), {
        family: "fonts"
      });
      // 加载背景图
      const img: any = await this.loadImg(url);
      // 创建canvas画布
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      // 将背景图嵌入画布中
      ctx.drawImage(img, 0, 0, img.width, img.height);
      return {
        ctx,
        canvas
      };
    } catch (error) {
      return error;
    }
  }
  /**
   * 绘写文字
   *
   * @param {*} ctx
   * @param {listVal} data
   * @memberof CanvasHandle
   */
  async drawFont(ctx: any, data: listVal) {
    ctx.font = `${data.fontSize}px fonts`;
    ctx.fillText(data.text, data.x, data.y);
  }
  /**
   * 绘制图片
   *
   * @param {*} ctx
   * @param {listVal} data
   * @memberof CanvasHandle
   */
  async publicImg(ctx: any, data: listVal) {
    const img: any = await this.loadImg(data.imgSrc);
    console.log(img);
    ctx.drawImage(
      img,
      data.x,
      data.y,
      data.w || img.width,
      data.h || img.height
    );
  }
  /**
   * 导出合成图片图片
   *
   * @param {*} canvas
   * @param {string} [imgName=`${new Date().valueOf()}`]
   * @param {string} [imgFolderName=`${new Date().valueOf()}`]
   * @returns
   * @memberof CanvasHandle
   */
  createFile(
    canvas: any,
    imgName: string = `${new Date().valueOf()}`,
    imgFolderName: string = `${new Date().valueOf()}`
  ) {
    return new Promise(resolve => {
      // 检测是否存在重名文件夹，有则删除，无则创建
      if (
        !fs.existsSync(
          path.join(__dirname, `../public/images/${imgFolderName}`)
        )
      ) {
        fs.mkdirSync(path.join(__dirname, `../public/images/${imgFolderName}`));
      }
      const out = fs.createWriteStream(
        path.join(__dirname, `../public/images/${imgFolderName}/${imgName}.png`)
      );
      // 获取canvas的图片二进制文本流
      const stream = canvas.pngStream();
      stream.on("data", chunk => {
        out.write(chunk);
      });
      stream.on("end", () => {
        console.log("saved png");
        resolve(imgName);
      });
    });
  }
}

export default new CanvasHandle();
