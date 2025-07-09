export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-08'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
)

export const token = assertValue(
  "skke3vjoGbMRN6RvPnIPYQRhm3hfn21Ce370oUBP90pZle4h4bGfrv8MCH3EwGc9e6saiui085EMTilHlErSn05Kwy4fCN6b6bB190HPcgFuOMHHTerYtUFQzAsRI8genPnvz3cgJEwIbI2Dm5Pa6WW8Q5zMFFADNv6FNPg0qbUQlL0WmY2N"
,
  'Missing environment variable: SANITY_API_KEY'
)

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
