import { Composition } from "remotion";
import { EblVideo } from "./EblVideo";
import T from "./timeline.json";

export function Root() {
  return (
    <Composition id="EBL" component={EblVideo} durationInFrames={T.total} fps={T.fps} width={1080} height={1920} />
  );
}
