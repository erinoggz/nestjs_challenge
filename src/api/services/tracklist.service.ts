import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { XMLParser } from 'fast-xml-parser';
import { firstValueFrom } from 'rxjs';

import { AppConfig } from '../../app.config';
import { ITrackList } from '../common/interface/tracklist.interface';

@Injectable()
export class TrackListService {
  private readonly baseUrl = AppConfig.musicbrainurl;
  private readonly parser = new XMLParser();

  constructor(private readonly httpService: HttpService) {}

  // fetch release information
  async fetchReleaseByMbid(mbid: string): Promise<{
    tracklist: ITrackList[];
    artist: string;
    album: string;
  }> {
    try {
      const url = `${this.baseUrl}/release/${mbid}?inc=recordings+artist-credits`;

      const response: any = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Accept: 'application/xml',
            'User-Agent': 'RecordManagement/1.0',
          },
        }),
      );

      const result = this.parser.parse(response.data);
      if (!result.metadata?.release) {
        throw new HttpException('Release not found', HttpStatus.NOT_FOUND);
      }

      const release = result.metadata.release;

      let artist = 'Unknown Artist';
      if (release['artist-credit']?.['name-credit']?.artist?.name) {
        artist = release['artist-credit']['name-credit'].artist.name;
      }

      const album = release.title || 'Unknown Album';

      const tracklist: ITrackList[] = [];

      if (
        release?.['medium-list']?.medium?.['track-list']?.track &&
        Array.isArray(release?.['medium-list']?.medium?.['track-list']?.track)
      ) {
        release?.['medium-list']?.medium?.['track-list']?.track.forEach(
          (track) => {
            tracklist.push({
              position: track?.position || '',
              title: track?.recording?.title || 'Unknown Track',
              duration: track?.recording?.length || '',
              first_release_date:
                track?.recording?.['first-release-date'] || '',
            });
          },
        );
      }
      return {
        tracklist,
        artist,
        album,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch data from MusicBrainz',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
