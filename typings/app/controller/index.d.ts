// This file is created by egg-ts-helper@1.25.6
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportCanvas from '../../../app/controller/canvas';

declare module 'egg' {
  interface IController {
    canvas: ExportCanvas;
  }
}
