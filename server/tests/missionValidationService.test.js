import { describe, expect, it } from 'vitest';
import missionValidationService from '../src/services/missionValidationService.js';

const { missionData, parseDate, parseNumber, parseJoursOff, parseJours } = missionValidationService;

describe('missionValidationService', () => {
  it('creates valid data for a complete mission', () => {
    const data = missionData({
      clientProduction: '  Studio Vela  ', type: 'FREELANCE', statut: 'CONFIRMED',
      dateDebut: '2026-09-01', dateFin: '2026-09-03', heures: '21',
      montantHt: '1800.50', nbJours: '3', note: '  Montage vidéo  ',
    });

    expect(data).toMatchObject({
      clientProduction: 'Studio Vela', type: 'FREELANCE', statut: 'CONFIRMED',
      heures: 21, montantHt: 1800.5, nbJours: 3, note: 'Montage vidéo',
    });
    expect(data.dateDebut).toBeInstanceOf(Date);
    expect(data.dateFin).toBeInstanceOf(Date);
  });

  it('accepts a partial update containing only the note', () => {
    expect(missionData({ note: 'Nouvelle note' }, { partial: true })).toEqual({ note: 'Nouvelle note' });
  });

  it('rejects a missing client or production', () => {
    expect(() => missionData({ clientProduction: ' ', type: 'FREELANCE', dateDebut: '2026-09-01' }))
      .toThrow('Client ou production requis');
  });

  it('rejects an unknown mission type', () => {
    expect(() => missionData({ clientProduction: 'Studio Vela', type: 'CDI', dateDebut: '2026-09-01' }))
      .toThrow('Type de mission invalide');
  });

  it('rejects an unknown status', () => {
    expect(() => missionData({ clientProduction: 'Studio Vela', type: 'FREELANCE', statut: 'CANCELLED', dateDebut: '2026-09-01' }))
      .toThrow('Statut de mission invalide');
  });

  it('rejects a mission ending before its start date', () => {
    expect(() => missionData({ clientProduction: 'Studio Vela', type: 'FREELANCE', dateDebut: '2026-09-03', dateFin: '2026-09-01' }))
      .toThrow('La date de fin doit être après la date de début');
  });

  it('rejects an invalid date', () => {
    expect(() => parseDate('not-a-date', 'Date de début')).toThrow('Date de début invalide');
  });

  it.each([-1, 'abc', Infinity])('rejects an invalid number: %s', (value) => {
    expect(() => parseNumber(value, 'Heures')).toThrow('Heures invalide');
  });

  it('returns null for an optional empty number', () => {
    expect(parseNumber('', 'Heures')).toBeNull();
  });

  // Masque des jours travailles. Les jours de semaine suivent getUTCDay()
  // (0 = dimanche ... 6 = samedi), et les exceptions sont des jours, pas des
  // instants : elles reviennent a minuit UTC.
  describe('working-day mask', () => {
    it('sorts and de-duplicates the recurring days off', () => {
      expect(parseJoursOff([6, 0, 6], 'Jours non travaillés')).toEqual([0, 6]);
    });

    it('treats a missing mask as no day off', () => {
      expect(parseJoursOff(undefined, 'Jours non travaillés')).toEqual([]);
    });

    it.each([[7], [-1], [1.5], ['lundi'], 'not-an-array'])(
      'rejects an invalid day: %s',
      (value) => {
        expect(() => parseJoursOff(value, 'Jours non travaillés'))
          .toThrow('Jours non travaillés invalide');
      },
    );

    it('normalises one-off dates to UTC midnight, sorted and de-duplicated', () => {
      const jours = parseJours(
        ['2026-09-10T18:30:00.000Z', '2026-09-02', '2026-09-10'],
        'Date exclue',
      );

      expect(jours.map((jour) => jour.toISOString())).toEqual([
        '2026-09-02T00:00:00.000Z',
        '2026-09-10T00:00:00.000Z',
      ]);
    });

    it('rejects an invalid one-off date', () => {
      expect(() => parseJours(['not-a-date'], 'Date exclue')).toThrow('Date exclue invalide');
    });

    it('carries the mask through missionData', () => {
      const data = missionData({
        clientProduction: 'Studio Vela', type: 'FREELANCE', dateDebut: '2026-09-01',
        dateFin: '2026-09-16', joursOff: [6, 0], datesExclues: ['2026-09-10'],
        datesIncluses: ['2026-09-12'],
      });

      expect(data.joursOff).toEqual([0, 6]);
      expect(data.datesExclues[0].toISOString()).toBe('2026-09-10T00:00:00.000Z');
      expect(data.datesIncluses[0].toISOString()).toBe('2026-09-12T00:00:00.000Z');
    });

    it('leaves the mask untouched when a partial update omits it', () => {
      expect(missionData({ note: 'Nouvelle note' }, { partial: true }))
        .toEqual({ note: 'Nouvelle note' });
    });
  });
});
