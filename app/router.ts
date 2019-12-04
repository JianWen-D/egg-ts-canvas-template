import { Application } from "egg";

export default (app: Application) => {
  const { controller, router } = app;

  router.post("/canvas", controller.canvas.index);
};
