// Display currencies for showing trip prices — USD is the base and every rate here is a FIXED DEMO VALUE, never a live exchange rate.
const currencies = [
  {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    rate: 1
  },
  {
    code: 'NPR',
    symbol: 'Rs',
    label: 'Nepalese Rupee',
    rate: 133.5
  },
  {
    code: 'KRW',
    symbol: '₩',
    label: 'South Korean Won',
    rate: 1372
  },
  {
    code: 'JPY',
    symbol: '¥',
    label: 'Japanese Yen',
    rate: 152.4
  },
  {
    code: 'INR',
    symbol: '₹',
    label: 'Indian Rupee',
    rate: 83.6
  }
]

export default currencies
