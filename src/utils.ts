const clampScale = (scale: number, min: number, max: number) => {
	return Math.min(Math.max(scale, min), max)
}

const getScaleFromDimensions = (width: number, height: number) => {
  // TODO: MAKE SMARTER CHOICE BASED ON AVAILABLE FREE VERTICAL SPACE
  return width > height ? width / height * 0.8 : height / width * 0.8
}

export { clampScale, getScaleFromDimensions }
