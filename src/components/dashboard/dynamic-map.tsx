'use client';

import { incidents } from '@/lib/mock-data';
import MapWrapper from './map-wrapper';

const DynamicMap = () => {
  return <MapWrapper incidents={incidents} />;
};

export default DynamicMap;
