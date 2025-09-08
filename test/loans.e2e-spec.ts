import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

jest.setTimeout(30000)

describe('Library Loans e2e', () => {
	let app: INestApplication
	let prisma: PrismaService
	let server: any

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()
		app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
		await app.init()

		server = app.getHttpServer()
		prisma = moduleRef.get(PrismaService)
		await prisma.$connect()
	}, 30000)

	beforeEach(async () => {
		await prisma.$transaction([
			prisma.loan.deleteMany(),
			prisma.book.deleteMany(),
			prisma.user.deleteMany(),
		])

		await prisma.book.createMany({
			data: [
				{ sku: 'TEST-001', title: 'Test Book', author: 'Test Author', copiesTotal: 2 },
				{ sku: 'TEST-002', title: 'Test Book 2', author: 'Test Author 2', copiesTotal: 2 },
				{ sku: 'TEST-003', title: 'Test Book 3', author: 'Test Author 3', copiesTotal: 1 },
				{ sku: 'TEST-004', title: 'Test Book 4', author: 'Test Author 4', copiesTotal: 2 },
			],
		})

		await prisma.user.createMany({
			data: [
				{ userId: 'test-user-1' },
				{ userId: 'test-user-2' },
				{ userId: 'test-user-3' },
			],
		})
	})

	afterAll(async () => {
		try {
			await prisma.$disconnect()
		} finally {
			await app.close()
			if (server?.close) {
				await new Promise<void>((resolve) => server.close(() => resolve()))
			}
			jest.useRealTimers()
		}
	})

	describe('POST /loans', () => {
		it('should create a loan successfully', async () => {
			const response = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			expect(response.body).toMatchObject({
				sku: 'TEST-001',
				title: 'Test Book',
				author: 'Test Author',
				userId: 'test-user-1',
				status: 'ACTIVE',
			})
			expect(response.body.id).toBeDefined()
			expect(response.body.loanDate).toBeDefined()
		}, 30000)

		it('should return 404 when book does not exist', async () => {
			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'NON-EXISTENT' })
				.expect(404)
		})

		it('should create user automatically when user does not exist', async () => {
			const response = await request(server)
				.post('/loans')
				.set('x-user-id', 'non-existent-user')
				.send({ sku: 'TEST-001' })
				.expect(201)

			expect(response.body).toMatchObject({
				sku: 'TEST-001',
				title: 'Test Book',
				author: 'Test Author',
				userId: 'non-existent-user',
				status: 'ACTIVE',
			})
		})

		it('should return 409 when book is out of stock', async () => {
			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-003' })
				.expect(201)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-2')
				.send({ sku: 'TEST-003' })
				.expect(409)
		})

		it('should return 409 when user has maximum active loans (2)', async () => {
			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-002' })
				.expect(201)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-004' })
				.expect(409)
		})

		it('should allow new loans after returning books', async () => {
			const loan1 = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-002' })
				.expect(201)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-004' })
				.expect(409)

			await request(server)
				.patch(`/loans/${loan1.body.id}/return`)
				.set('x-user-id', 'test-user-1')
				.expect(200)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-004' })
				.expect(201)
		})

		it('should validate request body', async () => {
			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({})
				.expect(400)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: '' })
				.expect(400)
		})

		it('should require x-user-id header', async () => {
			await request(server).post('/loans').send({ sku: 'TEST-001' }).expect(400)
		})
	})

	describe('PATCH /loans/:id/return', () => {
		it('should return a loan successfully', async () => {
			const loan = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			const response = await request(server)
				.patch(`/loans/${loan.body.id}/return`)
				.set('x-user-id', 'test-user-1')
				.expect(200)

			expect(response.body).toMatchObject({
				id: loan.body.id,
				sku: 'TEST-001',
				title: 'Test Book',
				author: 'Test Author',
				userId: 'test-user-1',
				status: 'RETURNED',
			})
			expect(response.body.returnDate).toBeDefined()
		})

		it('should return 404 when loan does not exist', async () => {
			await request(server)
				.patch('/loans/non-existent-id/return')
				.set('x-user-id', 'test-user-1')
				.expect(404)
		})

		it('should return 400 when loan does not belong to user', async () => {
			const loan = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			await request(server)
				.patch(`/loans/${loan.body.id}/return`)
				.set('x-user-id', 'test-user-2')
				.expect(400)
		})

		it('should return 409 when loan is already returned', async () => {
			const loan = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			await request(server)
				.patch(`/loans/${loan.body.id}/return`)
				.set('x-user-id', 'test-user-1')
				.expect(200)

			await request(server)
				.patch(`/loans/${loan.body.id}/return`)
				.set('x-user-id', 'test-user-1')
				.expect(409)
		})

		it('should require x-user-id header', async () => {
			await request(server).patch('/loans/some-id/return').expect(400)
		})
	})

	describe('Integration scenarios', () => {
		it('should handle multiple users borrowing different books', async () => {
			const loan1 = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			const loan2 = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-2')
				.send({ sku: 'TEST-002' })
				.expect(201)

			const loan3 = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-3')
				.send({ sku: 'TEST-004' })
				.expect(201)

			await request(server)
				.patch(`/loans/${loan1.body.id}/return`)
				.set('x-user-id', 'test-user-1')
				.expect(200)

			await request(server)
				.patch(`/loans/${loan2.body.id}/return`)
				.set('x-user-id', 'test-user-2')
				.expect(200)

			await request(server)
				.patch(`/loans/${loan3.body.id}/return`)
				.set('x-user-id', 'test-user-3')
				.expect(200)
		})

		it('should allow same user to borrow same book after returning', async () => {
			const loan = await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)

			await request(server)
				.patch(`/loans/${loan.body.id}/return`)
				.set('x-user-id', 'test-user-1')
				.expect(200)

			await request(server)
				.post('/loans')
				.set('x-user-id', 'test-user-1')
				.send({ sku: 'TEST-001' })
				.expect(201)
		})
	})
})
