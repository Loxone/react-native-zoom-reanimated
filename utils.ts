const clampScale = (scale: number, min: number, max: number) => {
	return Math.min(Math.max(scale, min), max)
}

export { clampScale }
