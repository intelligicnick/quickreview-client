import { MobileScreenFrame } from '../MobileScreenFrame';
import { LandingDashboardScreen } from './screens/LandingDashboardScreen';
import { LandingMenuScreen } from './screens/LandingMenuScreen';
import { LandingReviewScreen } from './screens/LandingReviewScreen';

const phoneWrap = 'pointer-events-none w-[min(100%,220px)] shrink-0 scale-[0.92] sm:scale-100';

export function LandingPhoneStack() {
  return (
    <div
      className="relative mx-auto flex h-[min(300px,52vw)] w-full max-w-lg items-end justify-center sm:h-[400px] md:h-[440px] sm:max-w-none"
      aria-hidden
    >
      <div
        className={`absolute bottom-0 left-1/2 z-10 -translate-x-[calc(50%+4.5rem)] rotate-[-8deg] sm:-translate-x-[calc(50%+5.5rem)] ${phoneWrap}`}
      >
        <MobileScreenFrame compact hideNotch className="shadow-2xl">
          <LandingMenuScreen />
        </MobileScreenFrame>
      </div>
      <div className={`relative z-20 ${phoneWrap} max-w-[240px]`}>
        <MobileScreenFrame compact hideNotch className="shadow-[0_24px_60px_rgba(27,35,51,0.35)]">
          <LandingReviewScreen />
        </MobileScreenFrame>
      </div>
      <div
        className={`absolute bottom-0 left-1/2 z-10 -translate-x-[calc(50%-4.5rem)] rotate-[8deg] sm:-translate-x-[calc(50%-5.5rem)] ${phoneWrap}`}
      >
        <MobileScreenFrame compact hideNotch className="shadow-2xl">
          <LandingDashboardScreen />
        </MobileScreenFrame>
      </div>
    </div>
  );
}

export function LandingPhoneSingle() {
  return (
    <div className="mx-auto w-[min(100%,240px)]" aria-hidden>
      <MobileScreenFrame compact hideNotch>
        <LandingReviewScreen />
      </MobileScreenFrame>
    </div>
  );
}

export function LandingPhoneDashboard() {
  return (
    <div className="mx-auto w-[min(100%,240px)]" aria-hidden>
      <MobileScreenFrame compact hideNotch>
        <LandingDashboardScreen />
      </MobileScreenFrame>
    </div>
  );
}

export function LandingPhoneReviewMini() {
  return (
    <div className="mx-auto w-[min(100%,180px)] -rotate-3 scale-[0.88] sm:scale-95" aria-hidden>
      <MobileScreenFrame compact hideNotch className="shadow-xl">
        <LandingReviewScreen />
      </MobileScreenFrame>
    </div>
  );
}
