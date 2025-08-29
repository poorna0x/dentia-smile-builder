// Test file for FDI tooth numbering system
import { toothChartUtils } from './dental-treatments'

export const testToothNumbering = () => {
  console.log('🧪 Testing FDI Tooth Numbering System...')

  // Test FDI System
  console.log('\n🦷 Testing FDI Numbering System:')
  const fdiTeeth = toothChartUtils.getAllTeeth()
  console.log('All teeth:', fdiTeeth)
  
  // Test positions and names
  console.log('\n📍 Testing Positions and Names:')
  const testFDI = ['11', '18', '21', '28', '31', '38', '41', '48']
  testFDI.forEach(num => {
    const position = toothChartUtils.getToothPosition(num)
    const name = toothChartUtils.getToothName(num)
    console.log(`FDI ${num}: ${position} - ${name}`)
  })
  
  // Test quadrants
  console.log('\n🔢 Testing Quadrants:')
  const quadrants = ['11', '21', '31', '41']
  quadrants.forEach(num => {
    const quadrant = toothChartUtils.getQuadrant(num)
    const arch = toothChartUtils.getArch(num)
    const side = toothChartUtils.getSide(num)
    console.log(`FDI ${num}: Quadrant ${quadrant}, ${arch} ${side}`)
  })
  
  // Test specific known positions
  console.log('\n📋 Specific Position Tests:')
  const testCases = [
    { number: '11', expected: 'Maxillary Right', expectedName: 'Central Incisor' },
    { number: '18', expected: 'Maxillary Right', expectedName: 'Third Molar' },
    { number: '21', expected: 'Maxillary Left', expectedName: 'Central Incisor' },
    { number: '28', expected: 'Maxillary Left', expectedName: 'Third Molar' },
    { number: '31', expected: 'Mandibular Left', expectedName: 'Central Incisor' },
    { number: '38', expected: 'Mandibular Left', expectedName: 'Third Molar' },
    { number: '41', expected: 'Mandibular Right', expectedName: 'Central Incisor' },
    { number: '48', expected: 'Mandibular Right', expectedName: 'Third Molar' }
  ]

  testCases.forEach(test => {
    const position = toothChartUtils.getToothPosition(test.number)
    const name = toothChartUtils.getToothName(test.number)
    
    console.log(`FDI ${test.number}: ${position} - ${name}`)
    if (position === test.expected && name === test.expectedName) {
      console.log('  ✅ PASS')
    } else {
      console.log('  ❌ FAIL')
    }
  })

  console.log('\n🧪 FDI Tooth Numbering Tests Complete!')
}
