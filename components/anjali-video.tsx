export function AnjaliVideo() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-0 sm:p-6">
      <video
        aria-label="Anjali video"
        autoPlay
        className="max-h-dvh w-full bg-black object-contain sm:w-auto sm:max-w-full sm:rounded-2xl"
        controls
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src="/media/anjali-reel.mp4" type="video/mp4" />
        Your browser does not support embedded video.
      </video>
    </main>
  );
}
