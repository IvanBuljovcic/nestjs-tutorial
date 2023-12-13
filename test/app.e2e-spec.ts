import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // removes any properties that are not in the DTO
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333');
  }); // beforeAll

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'foo@bar.baz',
      password: 'a1234567B!',
    };

    describe('Signup', () => {
      it('Should trow error if password is too short', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            password: '123567',
          })
          .expectStatus(400);
      });

      it('Should throw error if password is too weak', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            password: '12345678',
          })
          .expectStatus(400);
      });

      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            email: '',
          })
          .expectStatus(400);
      });

      it('Should throw error if email is invalid', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            email: 'invalid-email',
          })
          .expectStatus(400);
      });

      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            password: '',
          })
          .expectStatus(400);
      });

      it('Should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });

      it('Should throw error if email is in use', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(403);
      });
    });

    describe('Sign in', () => {
      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            email: '',
          })
          .expectStatus(400);
      });

      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            password: '',
          })
          .expectStatus(400);
      });

      it('Should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('access_token', 'access_token');
      });
    });
  });

  describe('User', () => {
    beforeEach(async () => {
      await prisma.user.upsert({
        where: { email: 'john.doe@gmail.com' },
        create: {
          email: 'john.doe@gmail.com',
          firstName: 'John',
          lastName: 'Doe',
          hash: '$argon2id$v=19$m=65536,t=3,p=4$D8r5uATWtj01JiX8n6KykA$lgIX5L6zpKgzajC2TXdgcUtAuOGWP+uXy1CsALBgnGM',
        },
        update: {},
      });
    });

    describe('Get user', () => {
      it('Should throw error if user is not authenticated', () => {
        return pactum
          .spec()
          .get('/users/me')
          .expectStatus(401);
      });

      it('Should get user by id', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken('$S{access_token}')
          .expectStatus(200);
      });
    });

    describe('Update user', () => {
      it('Update user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withBearerToken('$S{access_token}')
          .withBody({
            firstName: 'Foo',
            lastName: 'Bar',
          })
          .expectStatus(200)
          .expectBodyContains('foo@bar.baz');
      });
    });

    describe('Delete user', () => {
      it('Delete user by id', async () => {
        const { id } = await prisma.user.findUnique({
          where: { email: 'john.doe@gmail.com' },
        });

        return pactum
          .spec()
          .delete('/users/{id}')
          .withPathParams('id', id)
          .expectStatus(200)
          .inspect();
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{access_token}')
          .expectStatus(200)
          .expectBodyContains('[]');
      });
    });

    describe('Create bookmark', () => {
      it('Creates a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{access_token}')
          .withBody({
            link: 'https://nestjs.com/',
            title: 'NestJS',
          })
          .expectStatus(201)
          .stores('bookmark_id', 'id');
      });
    });

    describe('Get bookmark', () => {
      it('Gets all bookmarks of user', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{access_token}')
          .expectStatus(200)
          .expectJsonLength(1);
      });

      it('Gets a bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withBearerToken('$S{access_token}')
          .expectStatus(200);
      });
    });

    describe('Update bookmark', () => {
      it('Updates a bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withBearerToken('$S{access_token}')
          .withBody({
            title: 'NestJS Framework',
          })
          .expectStatus(200);
      });
    });

    describe('Delete bookmark', () => {
      it('Deletes a bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withBearerToken('$S{access_token}')
          .expectStatus(204);
      });
    });
  });
});
