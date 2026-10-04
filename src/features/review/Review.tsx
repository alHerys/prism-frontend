import { ReviewView } from "./ReviewView";
import { useReview } from "./useReview";
export function Review() {
  const model = useReview();
  return <ReviewView {...model} />;
}
