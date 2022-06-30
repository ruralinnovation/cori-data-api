// @ts-nocheck -
const {
  GraphQLString: Str,
  GraphQLFloat: Float,
  GraphQLList: List,
  GraphQLEnumType: EnumType,
  GraphQLObjectType: ObjectType,
  GraphQLScalarType: ScalarType,
  GraphQLInterfaceType: InterfaceType,
  GraphQLUnionType: UnionType,
  GraphQLNonNull: NonNull
} = require('graphql');

const GeoJSON = {
  TypeEnum: new EnumType({
    name: 'GeoJSONType',
    description: 'Enumeration of all GeoJSON object types.',
    values: {
      Point: { value: 'Point' },
      MultiPoint: { value: 'MultiPoint' },
      LineString: { value: 'LineString' },
      MultiLineString: { value: 'MultiLineString' },
      Polygon: { value: 'Polygon' },
      MultiPolygon: { value: 'MultiPolygon' },
      GeometryCollection: { value: 'GeometryCollection' },
      Feature: { value: 'Feature' },
      FeatureCollection: { value: 'FeatureCollection' }
    }
  }),

  JsonScalar: new ScalarType({
    name: 'AWSJSON'
  }),

  PointObject: new ObjectType({
    name: 'GeoJSONPoint',
    type: 'GeoJSONPoint',
    description: 'Object describing a single geographical point.',
    interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  MultiPointObject: new ObjectType({
    name: 'GeoJSONMultiPoint',
    description: 'Object describing multiple geographical points.',
    interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  LineStringObject: new ObjectType({
    name: 'GeoJSONLineString',
    description: 'Object describing a single connected sequence of geographical points.',
    interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  MultiLineStringObject: new ObjectType({
    name: 'GeoJSONMultiLineString',
    description: 'Object describing multiple connected sequences of geographical points.',
    interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  PolygonObject: new ObjectType({
    name: 'GeoJSONPolygon',
    description: 'Object describing a single shape formed by a set of geographical points.',
    interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  MultiPolygonObject: new ObjectType({
    name: 'GeoJSONMultiPolygon',
    type: 'MultiPolygonObject',
    description: 'Object describing multiple shapes formed by sets of geographical points.',
    interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  GeometryCollectionObject: new ObjectType({
    name: 'GeoJSONGeometryCollection',
    description: 'A set of multiple geometries, possibly of various types.',
    interfaces: () => [GeoJSON.GeoJSONInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      geometries: { type: new NonNull(new List(new NonNull(GeoJSON.GeometryInterface))) }
    })
  }),

  FeatureObject: new ObjectType({
    name: 'GeoJSONFeature',
    description: 'An object that links a geometry to properties in order to provide context.',
    interfaces: () => [GeoJSON.GeoJSONInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      geometry: { type: GeoJSON.GeometryInterface },
      properties: { type: GeoJSON.JsonScalar },
      id: { type: Str }
    })
  }),

  FeatureCollectionObject: new ObjectType({
    name: 'GeoJSONFeatureCollection',
    description: 'A set of multiple features.',
    interfaces: () => [GeoJSON.GeoJSONInterface],
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      features: { type: new NonNull(new List(new NonNull(GeoJSON.FeatureObject))) }
    })
  }),

  CRSTypeEnum: new EnumType({
    name: 'GeoJSONCRSType',
    description: 'Enumeration of all GeoJSON CRS object types.',
    values: {
      name: { value: 'name' },
      link: { value: 'link' }
    }
  }),

  NamedCRSPropertiesObject: new ObjectType({
    name: 'GeoJSONNamedCRSProperties',
    description: 'Properties for name based CRS object.',
    fields: () => ({
      name: { type: new NonNull(Str) }
    })
  }),

  LinkedCRSPropertiesObject: new ObjectType({
    name: 'GeoJSONLinkedCRSProperties',
    description: 'Properties for link based CRS object.',
    fields: () => ({
      href: { type: new NonNull(Str) },
      type: { type: Str }
    })
  }),

  CRSPropertiesUnion: new UnionType({
    name: 'GeoJSONCRSProperties',
    description: 'CRS object properties.',
    types: () => [GeoJSON.NamedCRSPropertiesObject, GeoJSON.LinkedCRSPropertiesObject]
  }),

  CoordinateReferenceSystemObject: new ObjectType({
    name: 'GeoJSONCoordinateReferenceSystem',
    description: 'Coordinate Reference System (CRS) object.',
    fields: () => ({
      type: { type: new NonNull(GeoJSON.CRSTypeEnum) },
      properties: { type: new NonNull(GeoJSON.CRSPropertiesUnion) }
    })
  }),

  GeoJSONInterface: new InterfaceType({
    name: 'GeoJSONInterface',
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) }
    })
  }),

  GeometryInterface: new InterfaceType({
    name: 'GeoJSONGeometryInterface',
    fields: () => ({
      type: { type: new NonNull(GeoJSON.TypeEnum) },
      crs: { type: GeoJSON.CoordinateReferenceSystemObject },
      bbox: { type: new List(Float) },
      coordinates: { type: GeoJSON.JsonScalar }
    })
  }),

  GeometryTypeUnion: new UnionType({
    name: 'GeoJSONGeometryTypes',
    description: 'Geometry Types',
    types: () => [
      GeoJSON.PointObject,
      GeoJSON.MultiLineStringObject,
      GeoJSON.LineStringObject,
      GeoJSON.PolygonObject,
      GeoJSON.MultiPointObject,
      GeoJSON.MultiPolygonObject
    ]
  })
};

export default GeoJSON;
