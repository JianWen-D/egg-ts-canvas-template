# 让你在 node 服务中轻松使用 canvas

---

## 前言

由于之前有个业务场景需要用到服务器动态生成图片并保存打包下载，在网上查阅了不少资料，但发现对于 node 的服务端生成图片的相关资料文章比较少，当然对于服务器动态合成图片你需可以使用其他技术栈，如：java，python，php 等，都有比较多的插件支持。本文主要介绍的是基于 node 服务中使用 canvas 动态合成图片的使用方式

## 开发环境

- 系统环境： `mac`或`linux`

- 脚手架：`egg + ts`

```
    使用官方脚手架：
    1、mkdir egg-ts-canvas-template && cd egg-ts-canvas-template
    2、npm init egg --type=ts
```

- 使用插件：

  [`canvas`](https://www.npmjs.com/package/canvas)

  ```
  npm install canvas --save || yarn add canvas
  ```


    ![](https://user-gold-cdn.xitu.io/2019/12/3/16ecb11a59d0099f?w=1994&h=926&f=png&s=895534)
    **在node服务中使用需要依赖对应服务器的环境，详细对应系统的环境如下：**
    | 系统 | 命令 |
    |------|------------|
    | OS X  | `brew install pkg-config cairo pango libpng jpeg giflib librsvg`          |
    | Ubuntu  | `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`|
    | Fedora  | `sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel`       |
    | Solaris  | `pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto`       |
    | OpenBSD  | `doas pkg_add cairo pango png jpeg giflib`       |
    | Windows  | See the [wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)       |
    | Others  | See the [wiki](https://github.com/Automattic/node-canvas/wiki)       |
    ***

    [`archiver`](https://www.npmjs.com/package/archiver)：压缩文件插件
    ```
    npm install archiver --save || yarn add archiver
    ```

## 开发实战

- **项目目录**

![](https://user-gold-cdn.xitu.io/2019/12/4/16ecf1023af49416?w=762&h=1278&f=png&s=104342)

```
核心文件目录:
/app/controller/canvas.ts   ----    路由/canvas的控制器
/app/public/*               ----    存储生成图片文件路径及压缩文件下载文件路径，供外部访问
/app/types/*                ----    请求参数的数据类型
/app/utils/canvas.ts        ----    canvas的使用方法
/app/utils/zip.ts           ----    压缩文件的使用方法
```

- **canvas 使用代码解析**

**步骤一：** 创建 canvas 画布

```
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
```

**步骤二：** 加载网络图片

```
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
```

**步骤三：** 绘制图片和文字

```
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
```

**步骤四：** 导出合成图片图片

```
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
```

---

- **zip 使用代码解析**

这里就不详细解释了，直接贴代码，具体看代码和 archiver 的 api

```
/**
 * 压缩方法
 *
 * @param {string} fileName 压缩文件名
 * @param {string} folderName 被压缩的目标文件夹名称
 * @param {boolean} [deleteFolder=false] 是否删除被压缩文件夹
 * @returns
 */
const zipHandle = (
  fileName: string = `${new Date().valueOf()}`,
  folderName: string,
  deleteFolder: boolean = false
) => {
  try {
    // 设置压缩的配置参数
    const archive = archiver("zip", {
      zlib: {
        level: 7 // 1-8级
      } // Sets the compression level.
    });

    // 创建导出文件
    const output = fs.createWriteStream(
      path.join(__dirname, `./../public/zip/${fileName}.zip`)
    );
    // 遍历删除目标文件夹内的文件
    const deleteFolderRecursive = (path: string) => {
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file: string) => {
          const curPath = path + "/" + file;
          if (fs.lstatSync(curPath).isDirectory()) {
            // recurse
            deleteFolderRecursive(curPath);
          } else {
            // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    };
    // 创建文件退出时
    output.on("close", () => {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );
      if (deleteFolder) {
        deleteFolderRecursive(
          path.join(__dirname, `./../public/images/${folderName}`)
        );
      }
    });
    // 创建文件结束时
    output.on("end", () => {
      console.log("Data has been drained");
    });

    // 压缩预警
    archive.on("warning", (err: any) => {
      if (err.code === "ENOENT") {
        console.log(err);
        // log warning
      } else {
        // throw error
        throw err;
      }
    });
    // 压缩报错
    archive.on("error", function(err) {
      throw err;
    });
    // 开始压缩，传入文本路径
    archive.pipe(output);

    archive.directory(
      path.join(__dirname, `./../public/images/${folderName}`),
      false
    );

    archive.finalize();
    return `/public/zip/${fileName}.zip`;
  } catch (error) {
    new Error(error);
  }
};
```

- **controller 代码解析**

```
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
      ctx.response.status = 500;
      ctx.body = error;
    }
  }
```

- **服务调用**

```
测试用例：
url: 'http://localhost:7001/canvas'
method：post,
body: {
  "bgSrc": "http://qgyc-system.oss-cn-hangzhou.aliyuncs.com/card/bg.png", // 背景图片
  "zip": false, // 是否压缩
  "zipName": "123", // 压缩文件民称
  "deleteFolder": false, // 是否删除被压缩的目标文件
  "data": [ // 数组信息
    {
      "fileName": "123", // 当前图片的文件名，图片为png格式
      "list": [
        {
          "type": "text", // 渲染类型，text:文本,img:图片
          "text": "123", // 文本内容
          "fontSize": 36, // 文本字体
          "x": 100, // x轴坐标
          "y": 100 // y轴坐标
        },
        {
          "type": "img",
          "imgSrc": "http://qgyc-system.oss-cn-hangzhou.aliyuncs.com/card/default.jpg", // 图片地址
          "w": 200,
          "h": 200,
          "x": 200,
          "y": 200
        }
      ]
    }
  ]
}
```

**成功**

![](https://user-gold-cdn.xitu.io/2019/12/4/16ed017033d0d943?w=1373&h=301&f=png&s=41121)

**失败报错**

![](https://user-gold-cdn.xitu.io/2019/12/4/16ed018a49c7677f?w=1371&h=234&f=png&s=34596)

## 最后

---

谢谢大家的阅读，希望这篇文章对大家有所帮助，嘻嘻。由于平时比较少些文章分享，文章的代码或逻辑中如有不妥的地方请大家多多指点哈，共同进步，早日暴富 💰
