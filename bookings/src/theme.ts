import { createTheme, type MantineColorsTuple } from '@mantine/core'

const primary: MantineColorsTuple = [
  '#F8F4F2', '#EFE7E1', '#E2D1C6', '#CEB4A1', '#BA9478',
  '#845F44', '#664934', '#4B3627', '#33251A', '#1F1610'
]

const secondary: MantineColorsTuple = [
  '#F6FAF0', '#EBF4DC', '#DAEABD', '#C2DC93', '#A8CD65',
  '#8DBA3C', '#739731', '#5B7827', '#475D1E', '#354617'
]

const accent: MantineColorsTuple = [
  '#FEF6EB', '#FEEAD2', '#FCD8AB', '#FBBF74', '#F9A439',
  '#F9A43A', '#F88F0D', '#D67A07', '#B36605', '#955505'
]

const surface: MantineColorsTuple = [
  '#F8F5F2', '#EEE7E2', '#E0D2C8', '#CBB6A4', '#B5967D',
  '#A07A5B', '#83644A', '#69503C', '#523F2F', '#3E3024'
]

export const theme = createTheme({
  primaryColor: 'primary',
  primaryShade: 5, // index 5 in the tuple above = the true brand hex (#845F44), not Mantine's usual darker default
  fontFamily: 'Inter, sans-serif',
  colors: { primary, secondary, accent, surface }
})