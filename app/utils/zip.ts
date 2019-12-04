"use strict";

import * as archiver from "archiver";
import * as fs from "fs";
import * as path from "path";

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

export default zipHandle;
