import { GuestPreviewHeading, MobileScreenFrame } from '../MobileScreenFrame';
import { ReviewGuestRatingPreview } from './ReviewGuestRatingPreview';

type Props = {
  locationName: string;
  address?: string | null;
  locked?: boolean;
};

export function ReviewGuestPreview({ locationName, address, locked = false }: Props) {
  const subtitle = address?.trim()
    ? address.trim()
    : 'How was your experience with us today?';

  return (
    <div className="space-y-4">
      <GuestPreviewHeading />
      <MobileScreenFrame>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {locked ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 px-4 text-center backdrop-blur-[1px]"
              aria-hidden
            >
              <p className="text-sm font-semibold text-muted">Activate QuickReview to publish</p>
            </div>
          ) : null}

          <ReviewGuestRatingPreview
            locationName={locationName}
            subtitle={subtitle}
            showTapHint
          />
        </div>
      </MobileScreenFrame>
    </div>
  );
}
