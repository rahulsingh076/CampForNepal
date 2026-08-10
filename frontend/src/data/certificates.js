// Sample records used to demonstrate the certificate layout. None are evidence of a real licence, membership, insurer, or affiliation.
const certificates = [
  {
    id: 'cert-001',
    title: 'Sample trekking licence record',
    issuer: 'Sample issuer record (demo only)',
    issuedDate: '2019-03-12',
    expiryDate: '2027-03-11',
    registrationNumber: 'DOT/TRK/2019/1846',
    description:
      'An illustrative record for the public certificate layout. It does not confirm that Camp For Nepal holds a trekking licence or can arrange permits.',
    image: '/images/certificates/trekking-agency-licence.jpg',
    verificationNote: 'No real-world verification is available for this sample record.',
    displayOrder: 1,
    status: 'published',
  },
  {
    id: 'cert-002',
    title: 'Sample tourism registration record',
    issuer: 'Sample issuer record (demo only)',
    issuedDate: '2019-04-02',
    expiryDate: null,
    registrationNumber: 'NTB/REG/4471',
    description:
      'An illustrative registration record. It is shown only to demonstrate CMS content and must not be relied on as evidence of company registration.',
    image: '/images/certificates/nepal-tourism-board.jpg',
    verificationNote: 'No real-world verification is available for this sample record.',
    displayOrder: 2,
    status: 'published',
  },
  {
    id: 'cert-003',
    title: 'Sample industry membership record',
    issuer: 'Sample issuer record (demo only)',
    issuedDate: '2019-05-20',
    expiryDate: '2027-05-19',
    registrationNumber: 'TAAN/2019/2233',
    description:
      'An illustrative membership entry. It does not establish any membership, crew policy, insurance cover, or operational standard.',
    image: '/images/certificates/taan-membership.jpg',
    verificationNote: 'No real-world verification is available for this sample record.',
    displayOrder: 3,
    status: 'published',
  },
  {
    id: 'cert-004',
    title: 'Sample climbing membership record',
    issuer: 'Sample issuer record (demo only)',
    issuedDate: '2020-02-11',
    expiryDate: '2027-02-10',
    registrationNumber: 'NMA/M/0912',
    description:
      'An illustrative membership record for this demonstration. It does not show authority to run climbing trips, issue permits, or verify guides.',
    image: '/images/certificates/nma-membership.jpg',
    verificationNote: 'No real-world verification is available for this sample record.',
    displayOrder: 4,
    status: 'published',
  },
  {
    id: 'cert-005',
    title: 'Sample crew-cover record',
    issuer: 'Sample insurer record (demo only)',
    issuedDate: '2026-01-01',
    expiryDate: '2026-12-31',
    registrationNumber: 'HGI/GRP/2026/0784',
    description:
      'An illustrative coverage record. It does not confirm insurance for any person, activity, rescue, guide, or trip.',
    image: '/images/certificates/crew-insurance.jpg',
    verificationNote: 'No real-world verification is available for this sample record.',
    displayOrder: 5,
    status: 'published',
  },
  {
    id: 'cert-006',
    title: 'Sample local business record',
    issuer: 'Sample issuer record (demo only)',
    issuedDate: '2019-06-08',
    expiryDate: null,
    registrationNumber: 'KCCI/M/6620',
    description:
      'An illustrative local-business record. It does not confirm an address, ownership, membership, or business standing.',
    image: '/images/certificates/kathmandu-chamber.jpg',
    verificationNote: 'No real-world verification is available for this sample record.',
    displayOrder: 6,
    status: 'published',
  },
]

export default certificates
