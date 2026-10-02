'use client';

import 'leaflet/dist/leaflet.css';
import { memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CENTER, TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';
import { ZONES, pointInZone, zoneBucketStyle } from '@/lib/zones';
import ZoneLegend from './ZoneLegend';
import ZoneTooltip from './ZoneTooltip';

const TOOLTIP_HIDE_DELAY = 180;

// Acknowledged/Repaired reports render as plain static circle markers.
function staticStyleForReport(report) {
  const base = TYPE_COLORS[report.type];
  if (report.status === 'Repaired') {
    return { radius: 8, color: '#5B6673', weight: 1, fillColor: '#8A9199', fillOpacity: 0.4 };
  }
  return { radius: 8, color: base, weight: 1, fillColor: base, fillOpacity: 0.55 };
}

function popupHtml(report) {
  return (
    '<div class="map-popup">' +
    '<div class="map-popup-head"><strong>' +
    report.id +
    '</strong><span class="badge ' +
    report.status +
    '">' +
    report.status +
    '</span></div>' +
    '<div>' +
    TYPE_LABELS[report.type] +
    ' — ' +
    report.confidence.toFixed(2) +
    '</div>' +
    '<div class="map-popup-address">' +
    report.address +
    '</div>' +
    '</div>'
  );
}

// "New" reports get a continuously-pulsing divIcon (pure CSS animation,
// no JS interval) so 15-20+ of them stay smooth. Everything else is a
// plain circleMarker.
function createMarkerForReport(L, report, onSelect) {
  let marker;
  if (report.status === 'New') {
    const color = TYPE_COLORS[report.type];
    const icon = L.divIcon({
      className: '',
      html:
        '<div class="new-marker">' +
        '<div class="new-marker-pulse" style="--ring-color:' +
        color +
        '"></div>' +
        '<div class="new-marker-dot" style="background:' +
        color +
        '"></div>' +
        '</div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    marker = L.marker([report.lat, report.lng], { icon });
  } else {
    marker = L.circleMarker([report.lat, report.lng], staticStyleForReport(report));
  }
  marker.bindPopup(popupHtml(report));
  marker.on('click', () => onSelect(report.id));
  return marker;
}

function MapView({ reports, onSelect, mapRef }) {
  const mapElRef = useRef(null);
  const mapObjRef = useRef(null);
  const leafletRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const zoneLayerRef = useRef(null);
  const markersByIdRef = useRef({});
  const reportsRef = useRef(reports);
  const onSelectRef = useRef(onSelect);
  const tooltipHideTimeoutRef = useRef(null);
  const [view, setView] = useState('pins');
  const [ready, setReady] = useState(false);
  const [zoneTooltip, setZoneTooltip] = useState(null);
  const [zoneNote, setZoneNote] = useState('');

  reportsRef.current = reports;
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const leafletModule = await import('leaflet');
      const L = leafletModule.default || leafletModule;
      if (typeof window !== 'undefined') {
        // leaflet.heat is a classic (non-ESM) plugin that attaches
        // itself to a global `L`, so it must see the same instance.
        window.L = L;
      }
      await import('leaflet.heat');
      if (cancelled || !mapElRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapElRef.current, { scrollWheelZoom: true }).setView(CENTER, 12);
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      osmLayer.on('tileerror', (e) => {
        if (e && e.tile) e.tile.style.display = 'none';
      });

      mapObjRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      zoneLayerRef.current = L.layerGroup();
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapObjRef.current) {
        mapObjRef.current.remove();
        mapObjRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildMarkers() {
    const L = leafletRef.current;
    const layer = markersLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    markersByIdRef.current = {};
    reportsRef.current.forEach((r) => {
      const marker = createMarkerForReport(L, r, (id) => onSelectRef.current(id));
      marker.addTo(layer);
      markersByIdRef.current[r.id] = marker;
    });
  }

  function buildHeat() {
    const L = leafletRef.current;
    const map = mapObjRef.current;
    if (!L) return;
    const points = reportsRef.current.map((r) => [r.lat, r.lng, r.confidence]);
    if (heatLayerRef.current && map) {
      map.removeLayer(heatLayerRef.current);
    }
    heatLayerRef.current = L.heatLayer(points, { radius: 28, blur: 20, maxZoom: 15 });
  }

  function clearTooltipHide() {
    if (tooltipHideTimeoutRef.current) {
      clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }
  }

  function scheduleTooltipHide() {
    clearTooltipHide();
    tooltipHideTimeoutRef.current = setTimeout(() => setZoneTooltip(null), TOOLTIP_HIDE_DELAY);
  }

  function handleZoneClick(zone, zoneReports) {
    if (zoneReports.length === 0) {
      setZoneNote(zone.name + ' — no reports in this zone.');
      setTimeout(() => setZoneNote(''), 1500);
      return;
    }
    if (zoneReports.length === 1) {
      onSelectRef.current(zoneReports[0].id);
      return;
    }
    // Multiple reports in one zone: ambiguous which pin they meant, so
    // switch to Pin View and fit the zone's bounds instead of guessing.
    setZoneTooltip(null);
    setView('pins');
    setTimeout(() => {
      const L = leafletRef.current;
      const map = mapObjRef.current;
      if (!L || !map) return;
      const bounds = L.latLngBounds([
        [zone.latMin, zone.lngMin],
        [zone.latMax, zone.lngMax]
      ]);
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 60);
  }

  function buildZones() {
    const L = leafletRef.current;
    const layer = zoneLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    ZONES.forEach((zone) => {
      const zoneReports = reportsRef.current.filter((r) => pointInZone(r.lat, r.lng, zone));
      const style = zoneBucketStyle(zoneReports.length);
      const poly = L.polygon(
        [
          [zone.latMax, zone.lngMin],
          [zone.latMax, zone.lngMax],
          [zone.latMin, zone.lngMax],
          [zone.latMin, zone.lngMin]
        ],
        { color: style.border, weight: 2, fillColor: style.fill, fillOpacity: style.fillOpacity }
      );

      poly.on('mouseover', (e) => {
        clearTooltipHide();
        setZoneTooltip({ x: e.containerPoint.x + 14, y: e.containerPoint.y + 14, zone, reports: zoneReports });
      });
      poly.on('mousemove', (e) => {
        clearTooltipHide();
        setZoneTooltip({ x: e.containerPoint.x + 14, y: e.containerPoint.y + 14, zone, reports: zoneReports });
      });
      poly.on('mouseout', scheduleTooltipHide);
      poly.on('click', () => handleZoneClick(zone, zoneReports));

      poly.addTo(layer);
    });
  }

  function applyView(nextView) {
    const map = mapObjRef.current;
    if (!map) return;
    if (markersLayerRef.current && map.hasLayer(markersLayerRef.current)) map.removeLayer(markersLayerRef.current);
    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) map.removeLayer(heatLayerRef.current);
    if (zoneLayerRef.current && map.hasLayer(zoneLayerRef.current)) map.removeLayer(zoneLayerRef.current);

    if (nextView === 'pins') {
      markersLayerRef.current.addTo(map);
    } else if (nextView === 'heat') {
      buildHeat();
      heatLayerRef.current.addTo(map);
    } else if (nextView === 'zones') {
      buildZones();
      zoneLayerRef.current.addTo(map);
    }
  }

  // Keep markers/zones (and the heat layer, if visible) in sync with
  // whatever (filtered) reports the dashboard currently holds.
  useEffect(() => {
    if (!ready) return;
    buildMarkers();
    buildZones();
    if (view === 'heat' && mapObjRef.current) {
      buildHeat();
      if (heatLayerRef.current && !mapObjRef.current.hasLayer(heatLayerRef.current)) {
        heatLayerRef.current.addTo(mapObjRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reports]);

  useEffect(() => {
    if (!ready) return;
    applyView(view);
    if (view !== 'zones') {
      clearTooltipHide();
      setZoneTooltip(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ready]);

  useEffect(() => {
    return () => clearTooltipHide();
  }, []);

  useImperativeHandle(mapRef, () => ({
    panTo(id) {
      const map = mapObjRef.current;
      const r = reportsRef.current.find((x) => x.id === id);
      if (!map || !r) return;
      map.flyTo([r.lat, r.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
      const marker = markersByIdRef.current[id];
      if (marker) marker.openPopup();
    },
    dropPulse(report) {
      const L = leafletRef.current;
      const map = mapObjRef.current;
      if (!L || !map) return;

      const color = TYPE_COLORS[report.type];
      const icon = L.divIcon({
        className: '',
        html: '<div class="pulse-ring" style="--ring-color:' + color + '"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      const pulseMarker = L.marker([report.lat, report.lng], { icon, interactive: false }).addTo(map);
      setTimeout(() => map.removeLayer(pulseMarker), 1000);

      if (view === 'pins' && markersLayerRef.current) {
        const marker = createMarkerForReport(L, report, (id) => onSelectRef.current(id));
        marker.addTo(markersLayerRef.current);
        markersByIdRef.current[report.id] = marker;
      } else if (view === 'heat') {
        buildHeat();
        if (heatLayerRef.current) heatLayerRef.current.addTo(map);
      }

      setTimeout(() => {
        map.flyTo([report.lat, report.lng], Math.max(map.getZoom(), 13), { duration: 1.2 });
      }, 150);
    },
    updateMarkerStyle(report) {
      // Status may have flipped between a pulsing divIcon marker and a
      // plain circleMarker, so rebuild this one marker from scratch
      // rather than trying to mutate it in place.
      const L = leafletRef.current;
      const layer = markersLayerRef.current;
      if (!L || !layer) return;
      const old = markersByIdRef.current[report.id];
      if (old) layer.removeLayer(old);
      const marker = createMarkerForReport(L, report, (id) => onSelectRef.current(id));
      marker.addTo(layer);
      markersByIdRef.current[report.id] = marker;
    },
    fitToZone(zoneName) {
      const L = leafletRef.current;
      const map = mapObjRef.current;
      const zone = ZONES.find((z) => z.name === zoneName);
      if (!L || !map || !zone) return;
      const bounds = L.latLngBounds([
        [zone.latMin, zone.lngMin],
        [zone.latMax, zone.lngMax]
      ]);
      map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8 });
    },
    resetView() {
      const map = mapObjRef.current;
      if (!map) return;
      map.flyTo(CENTER, 12, { duration: 0.8 });
    }
  }));

  return (
    <div className="map-panel">
      <div ref={mapElRef} id="map" />
      <div className="map-toggle">
        <button className={view === 'pins' ? 'active' : ''} onClick={() => setView('pins')}>
          Pin View
        </button>
        <button className={view === 'heat' ? 'active' : ''} onClick={() => setView('heat')}>
          Point Heat Map
        </button>
        <button className={view === 'zones' ? 'active' : ''} onClick={() => setView('zones')}>
          Zone Overview
        </button>
      </div>
      {view === 'zones' ? <ZoneLegend /> : null}
      {view === 'zones' && zoneNote ? <div className="zone-note">{zoneNote}</div> : null}
      {view === 'zones' && zoneTooltip ? (
        <ZoneTooltip
          x={zoneTooltip.x}
          y={zoneTooltip.y}
          zone={zoneTooltip.zone}
          reports={zoneTooltip.reports}
          onSelectReport={(id) => {
            clearTooltipHide();
            setZoneTooltip(null);
            onSelectRef.current(id);
          }}
          onMouseEnter={clearTooltipHide}
          onMouseLeave={scheduleTooltipHide}
        />
      ) : null}
    </div>
  );
}

export default memo(MapView);
