import * as ERROR_MSGS from '../constants/error_msgs';
import * as METADATA_KEY from '../constants/metadata_keys';
import * as interfaces from '../interfaces/interfaces';

function tagParameter(
  annotationTarget: NewableFunction,
  propertyName: string,
  parameterIndex: number,
  metadata: interfaces.Metadata
): void {
  const metadataKey = METADATA_KEY.TAGGED;
  _tagParameterOrProperty(metadataKey, annotationTarget, propertyName, metadata, parameterIndex);
}

function tagProperty(
  annotationTarget: NewableFunction,
  propertyName: string,
  metadata: interfaces.Metadata
): void {
  const metadataKey = METADATA_KEY.TAGGED_PROP;
  _tagParameterOrProperty(metadataKey, annotationTarget.constructor, propertyName, metadata);
}

function _tagParameterOrProperty(
  metadataKey: string,
  annotationTarget: NewableFunction,
  propertyName: string,
  metadata: interfaces.Metadata,
  parameterIndex?: number
) {
  let paramsOrPropertiesMetadata: interfaces.ReflectResult = {};
  const isParameterDecorator = typeof parameterIndex === 'number';
  const key: string = parameterIndex !== undefined && isParameterDecorator ?
    parameterIndex.toString() :
    propertyName;

  // if the decorator is used as a parameter decorator, the property name must be provided
  if (isParameterDecorator && propertyName !== undefined) {
    throw new Error(ERROR_MSGS.INVALID_DECORATOR_OPERATION);
  }

  // read metadata if available
  if (Reflect.hasOwnMetadata(metadataKey, annotationTarget)) {
    paramsOrPropertiesMetadata = Reflect.getMetadata(metadataKey, annotationTarget) as interfaces.ReflectResult;
  }

  // get metadata for the decorated parameter by its index
  let paramOrPropertyMetadata: interfaces.Metadata[] = paramsOrPropertiesMetadata[key];

  if (!Array.isArray(paramOrPropertyMetadata)) {
    paramOrPropertyMetadata = [];
  } else {
    for (const m of paramOrPropertyMetadata) {
      if (m.key === metadata.key) {
        throw new Error(`${ERROR_MSGS.DUPLICATED_METADATA} ${m.key.toString()}`);
      }
    }
  }

  // set metadata
  paramOrPropertyMetadata.push(metadata);
  paramsOrPropertiesMetadata[key] = paramOrPropertyMetadata;
  Reflect.defineMetadata(metadataKey, paramsOrPropertiesMetadata, annotationTarget);
}

function _decorate(decorators: unknown, target: NewableFunction): void {
  Reflect.decorate(decorators as ClassDecorator[], target);
}

function _param(paramIndex: number, decorator: ParameterDecorator) {
  return function (target: interfaces.IndexObject, key: string) {
    decorator(target, key, paramIndex);
  };
}

// Allows VanillaJS developers to use decorators:
// decorate(injectable("Foo", "Bar"), FooBar);
// decorate(targetName("foo", "bar"), FooBar);
// decorate(named("foo"), FooBar, 0);
// decorate(tagged("bar"), FooBar, 1);
function decorate(
  decorator: ClassDecorator | ParameterDecorator | MethodDecorator,
  target: NewableFunction,
  parameterIndex?: number | string
): void {
  if (typeof parameterIndex === 'number') {
    _decorate([_param(parameterIndex, decorator as ParameterDecorator)], target);
  } else if (typeof parameterIndex === 'string') {
    Reflect.decorate([decorator as MethodDecorator], target, parameterIndex);
  } else {
    _decorate([decorator as ClassDecorator], target);
  }
}

export { decorate, tagParameter, tagProperty };
