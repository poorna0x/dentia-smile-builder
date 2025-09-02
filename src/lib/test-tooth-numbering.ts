// Test file for FDI tooth numbering system
import { toothChartUtils } from './dental-treatments'

export const testToothNumbering = () => {

  // Test FDI System
  const fdiTeeth = toothChartUtils.getAllTeeth()
  
  // Test positions and names
  const testFDI = ['11', '18', '21', '28', '31', '38', '41', '48']
  testFDI.forEach(num => {
    const position = toothChartUtils.getToothPosition(num)
    const name = toothChartUtils.getToothName(num)
  })
  
  // Test quadrants
  const quadrants = ['11', '21', '31', '41']
  quadrants.forEach(num => {
    const quadrant = toothChartUtils.getQuadrant(num)
    const arch = toothChartUtils.getArch(num)
    const side = toothChartUtils.getSide(num)
  })
  
  // Test specific known positions
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
    
    if (position === test.expected && name === test.expectedName) {
    } else {
    }
  })

}
