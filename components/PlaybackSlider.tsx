import { Slider } from "@/components/ui/slider";

interface PlaybackSliderProps {
  handleSliderChange: (value: number[]) => void;
  playbackPosition: number;
}

export const PlaybackSlider: React.FC<PlaybackSliderProps> = ({ handleSliderChange, playbackPosition }) => {
  return (
    <Slider
      defaultValue={[0]}
      max={100}
      min={0}
      onValueChange={handleSliderChange}
      step={1}
      value={[playbackPosition]}
    />
  );
};
