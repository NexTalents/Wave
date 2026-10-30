/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_admin from "../auth/admin.js";
import type * as auth_authorization from "../auth/authorization.js";
import type * as auth_memberships from "../auth/memberships.js";
import type * as auth_organizations from "../auth/organizations.js";
import type * as auth_users from "../auth/users.js";
import type * as http from "../http.js";
import type * as transactions from "../transactions.js";
import type * as wastePickers from "../wastePickers.js";
import type * as whatsapp from "../whatsapp.js";
import type * as wpi_admin from "../wpi/admin.js";
import type * as wpi_authorization from "../wpi/authorization.js";
import type * as wpi_business from "../wpi/business.js";
import type * as wpi_calculation from "../wpi/calculation.js";
import type * as wpi_catalog from "../wpi/catalog.js";
import type * as wpi_observations from "../wpi/observations.js";
import type * as wpi_public_contract from "../wpi/public_contract.js";
import type * as wpi_seed from "../wpi/seed.js";
import type * as wpi_simulation from "../wpi/simulation.js";
import type * as wpi_snapshots from "../wpi/snapshots.js";
import type * as wpi_workflow from "../wpi/workflow.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/admin": typeof auth_admin;
  "auth/authorization": typeof auth_authorization;
  "auth/memberships": typeof auth_memberships;
  "auth/organizations": typeof auth_organizations;
  "auth/users": typeof auth_users;
  http: typeof http;
  transactions: typeof transactions;
  wastePickers: typeof wastePickers;
  whatsapp: typeof whatsapp;
  "wpi/admin": typeof wpi_admin;
  "wpi/authorization": typeof wpi_authorization;
  "wpi/business": typeof wpi_business;
  "wpi/calculation": typeof wpi_calculation;
  "wpi/catalog": typeof wpi_catalog;
  "wpi/observations": typeof wpi_observations;
  "wpi/public_contract": typeof wpi_public_contract;
  "wpi/seed": typeof wpi_seed;
  "wpi/simulation": typeof wpi_simulation;
  "wpi/snapshots": typeof wpi_snapshots;
  "wpi/workflow": typeof wpi_workflow;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
