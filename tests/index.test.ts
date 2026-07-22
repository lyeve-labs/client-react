import { describe, it, expect } from 'vitest';
import { CmsProvider, useQuery, useMutation } from '../src/index';

describe('@lyeve/cms-client-react', () => {
  it('exports CmsProvider', () => {
    expect(CmsProvider).toBeDefined();
    expect(typeof CmsProvider).toBe('function');
  });

  it('exports useQuery', () => {
    expect(useQuery).toBeDefined();
    expect(typeof useQuery).toBe('function');
  });

  it('exports useMutation', () => {
    expect(useMutation).toBeDefined();
    expect(typeof useMutation).toBe('function');
  });
});
