import { Router, type Request, type Response } from 'express'

const router = Router()

const mockCustomers = [
  {
    id: 1,
    name: '上海科技有限公司',
    contact: '张先生',
    phone: '13800138001',
    email: 'zhang@sh-tech.com',
    address: '上海市浦东新区张江高科技园区',
    type: 'enterprise',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 2,
    name: '北京贸易集团',
    contact: '李女士',
    phone: '13900139002',
    email: 'li@bj-trade.com',
    address: '北京市朝阳区国贸中心',
    type: 'enterprise',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20',
  },
  {
    id: 3,
    name: '广州制造业公司',
    contact: '王先生',
    phone: '13600136003',
    email: 'wang@gz-manufacture.com',
    address: '广州市天河区珠江新城',
    type: 'enterprise',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
]

router.get('/', (_req: Request, res: Response) => {
  res.json(mockCustomers)
})

router.get('/:id', (req: Request, res: Response) => {
  const customer = mockCustomers.find(c => c.id === parseInt(req.params.id))
  if (customer) {
    res.json(customer)
  } else {
    res.status(404).json({ error: 'Customer not found' })
  }
})

router.post('/', (req: Request, res: Response) => {
  const newCustomer = {
    ...req.body,
    id: mockCustomers.length + 1,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  }
  mockCustomers.push(newCustomer)
  res.status(201).json(newCustomer)
})

router.put('/:id', (req: Request, res: Response) => {
  const index = mockCustomers.findIndex(c => c.id === parseInt(req.params.id))
  if (index !== -1) {
    mockCustomers[index] = {
      ...mockCustomers[index],
      ...req.body,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    res.json(mockCustomers[index])
  } else {
    res.status(404).json({ error: 'Customer not found' })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const index = mockCustomers.findIndex(c => c.id === parseInt(req.params.id))
  if (index !== -1) {
    mockCustomers.splice(index, 1)
    res.status(204).send()
  } else {
    res.status(404).json({ error: 'Customer not found' })
  }
})

export default router