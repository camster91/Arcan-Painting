import { describe, expect, it } from 'vitest';
import { publicPath, safeAttribution } from '../src/utils/attribution.js';
describe('attribution privacy boundary', () => {
  it('drops query strings, fragments and private route identifiers', () => {
    expect(publicPath('/contact?email=client@example.test#name')).toBe('/contact');
    expect(publicPath('/account/reset-password?token=secret')).toBe('/other');
    expect(publicPath('/i/private-invoice-id')).toBe('/other');
    expect(safeAttribution({ landingPage:'/quote?phone=4165550123',referrer:'https://example.test/private/name?email=client@example.test',utmSource:'search',utmCampaign:'client@example.test',utmTerm:'416-555-0123',ignored:'value' })).toEqual({landingPage:'/quote',referrer:'https://example.test',utmSource:'search'});
  });
});
