import Spline from "@splinetool/react-spline";
import Button from "../components/button";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const handleCreateCanvas = () => {
    const roomId = crypto.randomUUID(); // generate unique room
    navigate(`/room/${roomId}`);
  };
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <Spline scene="https://prod.spline.design/rcMbTg9jBea0lL8m/scene.splinecode" />
      </div>

      {/* UI layer */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full gap-6 text-white">
        <Button label="Create Canvas" onClick={handleCreateCanvas} />
      </div>
    </div>
  );
}
