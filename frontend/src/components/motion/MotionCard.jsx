// Card that lifts slightly on hover. Reuses Card so the surface stays identical.
import Card from '../common/Card.jsx'

export default function MotionCard({ className = '', children, ...rest }) {
  // The lift and shadow live in the .motion-card CSS, which holds the limits.
  return (
    <Card className={`motion-card ${className}`} {...rest}>
      {children}
    </Card>
  )
}
