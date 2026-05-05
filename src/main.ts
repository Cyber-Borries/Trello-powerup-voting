import './styles.css';
import { blockerCount, formatDate, getVotes, toVoteView, uniqueCountries } from './storage';
import type { TrelloClient } from './types';

const ICON = './icon.svg';

window.TrelloPowerUp.initialize({
  'card-buttons': () => [
    {
      icon: ICON,
      text: 'Vote as Country',
      condition: 'signedIn',
      callback: (t: TrelloClient) =>
        t.popup({
          title: 'Vote as Country',
          url: t.signUrl('./vote.html'),
          height: 360
        })
    }
  ],

  'card-badges': async (t: TrelloClient) => {
    const votes = await getVotes(t);
    if (!votes.length) {
      return [];
    }

    const countries = uniqueCountries(votes);
    const blockers = blockerCount(votes);

    return [
      {
        icon: ICON,
        text: `${votes.length} ${votes.length === 1 ? 'vote' : 'votes'} / ${countries.length} ${
          countries.length === 1 ? 'country' : 'countries'
        }`,
        color: blockers > 0 ? 'red' : 'blue',
        refresh: 30
      }
    ];
  },

  'card-back-section': (t: TrelloClient) => ({
    title: 'Country Votes',
    icon: ICON,
    content: {
      type: 'iframe',
      url: t.signUrl('./section.html'),
      height: 220
    }
  }),

  'board-buttons': () => [
    {
      icon: { light: ICON, dark: ICON },
      text: 'Voting Report',
      condition: 'signedIn',
      callback: (t: TrelloClient) =>
        t.modal({
          title: 'Voting Report',
          url: t.signUrl('./report.html'),
          fullscreen: true
        })
    },
    {
      icon: { light: ICON, dark: ICON },
      text: 'Voting Settings',
      condition: 'signedIn',
      callback: (t: TrelloClient) =>
        t.modal({
          title: 'Voting Settings',
          url: t.signUrl('./settings.html'),
          height: 420
        })
    }
  ],

  'show-settings': (t: TrelloClient) =>
    t.modal({
      title: 'Voting Settings',
      url: t.signUrl('./settings.html'),
      height: 420
    }),

  'card-detail-badges': async (t: TrelloClient) => {
    const votes = await getVotes(t);
    if (!votes.length) {
      return [];
    }

    const blockers = blockerCount(votes);
    const latest = votes.slice().sort((a, b) => b.ua.localeCompare(a.ua))[0];

    return [
      {
        title: 'Country votes',
        text: `${votes.length} total, ${blockers} blocker${blockers === 1 ? '' : 's'}`,
        color: blockers > 0 ? 'red' : 'blue'
      },
      ...(latest
        ? [
            {
              title: 'Latest vote',
              text: `${toVoteView(latest).country} on ${formatDate(latest.ua)}`
            }
          ]
        : [])
    ];
  }
});
