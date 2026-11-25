/**
 * Web Mercator projection matching MapLibre's (512 px tiles).
 *
 * The map plate is a still rendered at a known center and zoom, so any
 * longitude/latitude can be placed on it with the same maths MapLibre used to
 * draw it - no need to read bounds back out of the renderer.
 */

export type LngLat = readonly [number, number];

export type PlateGeometry = {
  readonly center: LngLat;
  readonly zoom: number;
  /** Size in CSS pixels the plate was rendered at, before --scale. */
  readonly width: number;
  readonly height: number;
};

const TILE_SIZE = 512;

const projectToWorld = ([lng, lat]: LngLat, zoom: number): [number, number] => {
  const worldSize = TILE_SIZE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * worldSize;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize;
  return [x, y];
};

/** Position of a coordinate in plate pixels, origin top-left. */
export const toPlatePixel = (
  point: LngLat,
  plate: PlateGeometry,
): [number, number] => {
  const [centerX, centerY] = projectToWorld(plate.center, plate.zoom);
  const [x, y] = projectToWorld(point, plate.zoom);
  return [x - centerX + plate.width / 2, y - centerY + plate.height / 2];
};
