///<reference path="../interfaces/interfaces.d.ts" />

// Kernel
// ------

// Inversify is a lightweight pico container for TypeScript
// and JavaScript apps.

// A pico container uses a class constructor to identify and
// inject its dependencies. For this to work, the class needs
// to declare a constructor that includes everything it
// needs injected.

// In order to resolve a depencency, the pico container needs
// to be told which implementation type (classes) to associate
// with each service type (interfaces).

import { BindingCountEnum } from "../bindings/binding_count";
import { Lookup } from "./lookup";
import { Planner } from "../planning/planner";
import { Resolver } from "../resolution/resolver";
import * as ERROR_MSGS from "../constants/error_msgs";

class Kernel implements IKernel {

    private _parentKernel: IKernel;
    private _planner: IPlanner;
    private _resolver: IResolver;
    private _bindingDictionary: ILookup<IBinding<any>>;

    // Initialize private properties
    public constructor() {
        let middleWare = [];
        this._parentKernel = null;
        this._planner = new Planner();
        this._resolver = new Resolver(middleWare);
        this._bindingDictionary = new Lookup<IBinding<any>>();
    }

    // Regiters a type binding
    public bind(typeBinding: IBinding<any>): void {
        this._bindingDictionary.add(typeBinding.runtimeIdentifier, typeBinding);
    }

    // Removes a type binding from the registry by its key
    public unbind(runtimeIdentifier: string): void {
        try {
            this._bindingDictionary.remove(runtimeIdentifier);
        } catch (e) {
            throw new Error(`${ERROR_MSGS.CANNOT_UNBIND} ${runtimeIdentifier}`);
        }
    }

    // Removes all the type bindings from the registry
    public unbindAll(): void {
        this._bindingDictionary = new Lookup<IBinding<any>>();
    }

    // Resolves a dependency by its runtime identifier
    // The runtime identifier must be associated with only one binding
    // use getAll when the runtime identifier is associated with multiple bindings
    public get<Service>(runtimeIdentifier: string): Service {

        let bindings = this._getBindingsByRuntimeIdentifier<Service>(runtimeIdentifier);

        switch (bindings.length) {

            // CASE 1: There are no bindings
            case BindingCountEnum.NoBindingsAvailable:
                throw new Error(`${ERROR_MSGS.NOT_REGISTERED} ${runtimeIdentifier}`);

            // CASE 2: There is 1 binding    
            case BindingCountEnum.OnlyOneBindingAvailable:
                return this._planAndResolve<Service>(bindings[0]);

            // CASE 3: There are multiple bindings throw as don't have enough information (metadata)    
            case BindingCountEnum.MultipleBindingsAvailable:
            default:
                throw new Error(`${ERROR_MSGS.AMBIGUOUS_MATCH} ${runtimeIdentifier}`);
        }
    }

    // Resolves a dependency by its runtime identifier
    // The runtime identifier can be associated with one or multiple bindings
    public getAll<Service>(runtimeIdentifier: string): Service[] {

        let bindings = this._getBindingsByRuntimeIdentifier<Service>(runtimeIdentifier);

        switch (bindings.length) {

            // CASE 1: There are no bindings
            case BindingCountEnum.NoBindingsAvailable:
                throw new Error(`${ERROR_MSGS.NOT_REGISTERED} ${runtimeIdentifier}`);

            // CASE 2: There is AT LEAST 1 binding    
            case BindingCountEnum.OnlyOneBindingAvailable:
            case BindingCountEnum.MultipleBindingsAvailable:
            default:
                return bindings.map((binding) => {
                    return this._planAndResolve<Service>(binding);
                });
        }
    }

    // Returns all the available bindings for a selected runtime identifier
    private _getBindingsByRuntimeIdentifier<Service>(runtimeIdentifier: string): IBinding<Service>[] {
        let bindings: IBinding<Service>[] = [];
        if (this._bindingDictionary.hasKey(runtimeIdentifier)) {
            bindings = this._bindingDictionary.get(runtimeIdentifier);
        }
        return bindings;
    }

    // Generates an executes a resolution plan
    private _planAndResolve<Service>(binding: IBinding<Service>): Service {

        // STEP 1: generate resolution context
        let context = this._planner.createContext(this);

        // STEP 2: generate a resolutioin plan and link it to the context
        let plan = this._planner.createPlan(context, binding);

        // Plan and Context are duable linked
        context.addPlan(plan);

        // STEP 3: execute resolution plan
        return this._resolver.resolve<Service>(context);
    }

}

export { Kernel };
