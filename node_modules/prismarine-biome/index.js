module.exports = loader

let biomes

function loader (registryOrVersion) {
  const registry = typeof registryOrVersion === 'string' ? require('prismarine-registry')(registryOrVersion) : registryOrVersion
  biomes = registry.biomes
  return Biome
}

const emptyBiome = {
  color: 0,
  height: null,
  name: '',
  rainfall: 0,
  temperature: 0
}

function Biome (id) {
  return biomes[id] || { ...emptyBiome, id }
}
