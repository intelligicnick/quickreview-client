import { ReviewGuestRatingPreview } from '../../review/ReviewGuestRatingPreview';

export function LandingReviewScreen() {
  return (
    <ReviewGuestRatingPreview
      compact
      locationName="Harbor & Hearth"
      subtitle="How did we do on this visit?"
    />
  );
}
