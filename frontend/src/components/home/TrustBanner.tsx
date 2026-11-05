import ProceduralWave from "../themes/ProceduralWave";

export const TrustBanner = () => {
  return (
    <div>
      <ProceduralWave
        className="top-0 w-full"
        flip={false}
        seed={2}
        frequency={3}
        gradientFrom="#f0f8fc"
        gradientTo="#cce1f0"
        height={100}
      />
      <div className="bg-linear-to-b from-[#cce1f0] to-[#79afd9] w-full border-zinc-100 pt-8 pb-20">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 transition-all duration-500">
          
        </div>
      </div>
    </div>
  );
};

export default TrustBanner;