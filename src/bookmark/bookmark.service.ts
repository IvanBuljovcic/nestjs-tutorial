import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getBookmarks(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
    });

    return bookmarks;
  }

  async getBookmarkById(
    userId: number,
    bookmarkId: number,
  ) {
    const bookmarks = await this.prisma.bookmark.findUnique(
      {
        where: { userId, id: bookmarkId },
      },
    );

    return bookmarks;
  }

  async createBookmark(
    userId: number,
    dto: CreateBookmarkDto,
  ) {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });

    return bookmark;
  }

  async editBookmark(
    userId: number,
    bookmarkId: number,
    dto: EditBookmarkDto,
  ) {
    // Get bookmark by id
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId, id: bookmarkId },
    });

    // Check if user owns the bookmark
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error('Bookmark not found');
    }

    // Update bookmark
    const updatedBookmark =
      await this.prisma.bookmark.update({
        where: { id: bookmarkId, userId },
        data: { ...dto },
      });

    return updatedBookmark;
  }

  async deleteBookmark(userId: number, bookmarkId: number) {
    // Get bookmark by id
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId, id: bookmarkId },
    });

    // Check if user owns the bookmark
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error('Bookmark not found');
    }

    return this.prisma.bookmark.delete({
      where: { userId, id: bookmarkId },
    });
  }
}
