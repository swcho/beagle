import { Vibrant } from 'node-vibrant/node'

export async function extractColors(imagePath: string): Promise<string[]> {
  try {
    const palette = await Vibrant.from(imagePath).getPalette()
    return Object.values(palette)
      .filter((swatch): swatch is NonNullable<typeof swatch> => swatch !== null)
      .map((swatch) => swatch.hex)
      .slice(0, 5)
  } catch {
    return []
  }
}
