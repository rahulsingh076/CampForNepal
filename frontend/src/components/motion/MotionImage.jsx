// Image frame whose picture zooms gently on hover. The frame clips the zoom.
import ImageFrame from '../common/ImageFrame.jsx'

export default function MotionImage({ className = '', ...rest }) {
  return <ImageFrame className={`motion-image ${className}`} {...rest} />
}
