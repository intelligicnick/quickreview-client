import { ReviewGuestRatingPreview } from '../../review/ReviewGuestRatingPreview';

export function LandingReviewScreen() {
  return (
    <ReviewGuestRatingPreview
      compact
      locationName="Sunrise Café"
      subtitle="How was your visit today?"
    />
  );
}
