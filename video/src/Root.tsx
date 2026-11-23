import { Composition } from "remotion";
import { EblVideo } from "./EblVideo";
import { Trailer } from "./Trailer";
import { FPS, TOTAL, TrailerSon } from "./TrailerSon";
import T from "./timeline.json";
import TT from "./trailer.json";

export function Root() {
  return (
    <>
      <Composition id="EBL" component={EblVideo} durationInFrames={T.total} fps={T.fps} width={1080} height={1920} />
      <Composition id="Trailer" component={Trailer} durationInFrames={TT.total} fps={TT.fps} width={1080} height={1920} />
      <Composition id="TrailerSon" component={TrailerSon} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    </>
  );
}
