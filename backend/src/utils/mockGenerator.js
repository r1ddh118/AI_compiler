const categories = {
  crm: {
    app_name: 'Sales CRM',
    one_line_goal: 'Manage customer leads, deals, and interactions for sales teams.',
    problem_statement: 'Sales teams struggle to keep track of pipeline deals and contact histories in one place.',
    primary_users: ['Sales Representative', 'Sales Manager', 'Administrator'],
    core_capabilities: ['Contact Management', 'Deal Pipeline Tracking', 'User Authentication', 'Lead Analytics'],
    data_entities: [
      { name: 'users', description: 'Stores user credentials and roles.', important_fields: ['id', 'email', 'role'], relationships: ['Has many contacts', 'Has many deals'] },
      { name: 'contacts', description: 'Stores customer lead contact details.', important_fields: ['id', 'name', 'email', 'phone'], relationships: ['Belongs to user'] },
      { name: 'deals', description: 'Stores pipeline deals and value.', important_fields: ['id', 'title', 'amount', 'status'], relationships: ['Belongs to user'] }
    ],
    workflows: [
      { name: 'Lead creation', steps: ['Navigate to contacts page', 'Fill in contact form', 'Submit and view contact in list'] }
    ],
    ui_pages: ['dashboard', 'contacts', 'deals', 'login'],
    api_capabilities: ['Get all contacts', 'Create a new contact', 'Get all deals', 'Create a new deal'],
    auth_requirements: ['JWT authentication', 'Role-based access control (Admin, User)'],
    non_functional_requirements: ['High data security', 'Fast query latency'],
    execution_constraints: ['No external database dependency'],
    assumptions: ['User is authenticated for deal creation'],
    open_questions: [],
    
    // Architecture
    summary: 'A 3-tier web application with a relational SQLite/PostgreSQL database, Express backend, and React frontend.',
    bounded_contexts: [{ name: 'Auth', purpose: 'Handles authentication', capabilities: ['login', 'register'] }],
    services: [{ name: 'ContactService', responsibility: 'Manages contacts data', inputs: ['User request'], outputs: ['Database transaction'] }],
    api_surface: [
      { resource: 'contacts', methods: ['GET', 'POST'], description: 'Query and add contacts' },
      { resource: 'deals', methods: ['GET', 'POST'], description: 'Query and add deals' }
    ],
    ui_structure: [
      { page: 'contacts', components: ['contact_list', 'contact_form'] },
      { page: 'deals', components: ['deal_list', 'deal_form'] }
    ],
    auth_model: 'rbac',
    data_flow: ['Frontend -> Express API -> PostgreSQL -> Express API -> Frontend'],
    risks: [],
    
    // DB
    db: {
      tables: [
        {
          name: 'users',
          description: 'Stores user accounts',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'email', type: 'varchar(255)', required: true },
            { name: 'role', type: 'varchar(50)', required: true }
          ],
          primary_key: 'id',
          foreign_keys: []
        },
        {
          name: 'contacts',
          description: 'Stores sales contact leads',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'name', type: 'varchar(255)', required: true },
            { name: 'email', type: 'varchar(255)', required: true },
            { name: 'phone', type: 'varchar(50)', required: false }
          ],
          primary_key: 'id',
          foreign_keys: ['users']
        },
        {
          name: 'deals',
          description: 'Stores sales pipeline deals',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'title', type: 'varchar(255)', required: true },
            { name: 'amount', type: 'integer', required: true },
            { name: 'status', type: 'varchar(50)', required: true }
          ],
          primary_key: 'id',
          foreign_keys: ['users']
        }
      ],
      indexes: ['users_email_idx'],
      notes: []
    },
    
    // API
    api: {
      endpoints: [
        {
          id: 'get_contacts',
          method: 'GET',
          path: '/api/contacts',
          response: { ref: 'contacts' },
          request_body: { fields: [] },
          auth_roles: ['admin', 'user'],
          description: 'Retrieve all sales contacts'
        },
        {
          id: 'create_contact',
          method: 'POST',
          path: '/api/contacts',
          response: { ref: 'contacts' },
          request_body: {
            fields: [
              { name: 'name', type: 'string', required: true },
              { name: 'email', type: 'string', required: true },
              { name: 'phone', type: 'string', required: false }
            ]
          },
          auth_roles: ['admin', 'user'],
          description: 'Create a new contact lead'
        },
        {
          id: 'get_deals',
          method: 'GET',
          path: '/api/deals',
          response: { ref: 'deals' },
          request_body: { fields: [] },
          auth_roles: ['admin', 'user'],
          description: 'Retrieve all deals'
        },
        {
          id: 'create_deal',
          method: 'POST',
          path: '/api/deals',
          response: { ref: 'deals' },
          request_body: {
            fields: [
              { name: 'title', type: 'string', required: true },
              { name: 'amount', type: 'integer', required: true },
              { name: 'status', type: 'string', required: true }
            ]
          },
          auth_roles: ['admin', 'user'],
          description: 'Create a new sales deal'
        }
      ]
    },
    
    // UI
    ui: {
      components: [
        {
          id: 'contact_list',
          type: 'table',
          api_endpoint: 'GET /api/contacts',
          fields: [],
          props: {}
        },
        {
          id: 'contact_form',
          type: 'form',
          api_endpoint: 'POST /api/contacts',
          fields: [
            { name: 'name', source: 'input' },
            { name: 'email', source: 'input' },
            { name: 'phone', source: 'input' }
          ],
          props: {}
        },
        {
          id: 'deal_list',
          type: 'table',
          api_endpoint: 'GET /api/deals',
          fields: [],
          props: {}
        },
        {
          id: 'deal_form',
          type: 'form',
          api_endpoint: 'POST /api/deals',
          fields: [
            { name: 'title', source: 'input' },
            { name: 'amount', source: 'input' },
            { name: 'status', source: 'select' }
          ],
          props: {}
        }
      ],
      pages: ['dashboard', 'contacts', 'deals', 'login']
    },
    
    // Auth
    auth: {
      auth_model: 'jwt',
      roles: ['admin', 'user'],
      permissions: ['read_contacts', 'write_contacts', 'read_deals', 'write_deals', 'admin_analytics'],
      role_permissions: {
        admin: ['read_contacts', 'write_contacts', 'read_deals', 'write_deals', 'admin_analytics'],
        user: ['read_contacts', 'write_contacts', 'read_deals', 'write_deals']
      },
      business_rules: ['Admins can see lead analytics', 'Premium tier has payment integrations']
    }
  },
  project: {
    app_name: 'Task Board',
    one_line_goal: 'Track project tasks and collaborate on boards and cards.',
    problem_statement: 'Teams need to manage tasks and deadlines collaboratively in a clear visual workflow.',
    primary_users: ['Project Manager', 'Team Member', 'Client'],
    core_capabilities: ['Task Board View', 'Task Card Lifecycle Management', 'Team Member Assignment'],
    data_entities: [
      { name: 'boards', description: 'Stores information about visual project boards.', important_fields: ['id', 'title'], relationships: ['Has many lists'] },
      { name: 'tasks', description: 'Stores task details and completion status.', important_fields: ['id', 'title', 'status', 'due_date'], relationships: ['Belongs to board'] }
    ],
    workflows: [
      { name: 'Create task', steps: ['Open project board', 'Click Add Card', 'Fill details and save'] }
    ],
    ui_pages: ['boards', 'tasks', 'calendar'],
    api_capabilities: ['Get boards', 'Create task', 'Get tasks'],
    auth_requirements: ['Session auth'],
    non_functional_requirements: [],
    execution_constraints: [],
    assumptions: [],
    open_questions: [],
    summary: 'A collaboration tool structured around visual boards and task management.',
    bounded_contexts: [],
    services: [],
    api_surface: [],
    ui_structure: [],
    auth_model: 'rbac',
    data_flow: [],
    risks: [],
    db: {
      tables: [
        {
          name: 'boards',
          description: 'Project boards containing tasks',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'title', type: 'varchar(255)', required: true }
          ],
          primary_key: 'id',
          foreign_keys: []
        },
        {
          name: 'tasks',
          description: 'Task items belonging to boards',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'title', type: 'varchar(255)', required: true },
            { name: 'status', type: 'varchar(50)', required: true },
            { name: 'due_date', type: 'timestamp', required: false }
          ],
          primary_key: 'id',
          foreign_keys: ['boards']
        }
      ],
      indexes: [],
      notes: []
    },
    api: {
      endpoints: [
        {
          id: 'get_boards',
          method: 'GET',
          path: '/api/boards',
          response: { ref: 'boards' },
          request_body: { fields: [] },
          auth_roles: ['member', 'manager'],
          description: 'Get project boards'
        },
        {
          id: 'get_tasks',
          method: 'GET',
          path: '/api/tasks',
          response: { ref: 'tasks' },
          request_body: { fields: [] },
          auth_roles: ['member', 'manager'],
          description: 'Get tasks list'
        },
        {
          id: 'create_task',
          method: 'POST',
          path: '/api/tasks',
          response: { ref: 'tasks' },
          request_body: {
            fields: [
              { name: 'title', type: 'string', required: true },
              { name: 'status', type: 'string', required: true }
            ]
          },
          auth_roles: ['manager'],
          description: 'Create a new task'
        }
      ]
    },
    ui: {
      components: [
        {
          id: 'board_list',
          type: 'grid',
          api_endpoint: 'GET /api/boards',
          fields: [],
          props: {}
        },
        {
          id: 'task_list',
          type: 'table',
          api_endpoint: 'GET /api/tasks',
          fields: [],
          props: {}
        },
        {
          id: 'task_form',
          type: 'form',
          api_endpoint: 'POST /api/tasks',
          fields: [
            { name: 'title', source: 'input' },
            { name: 'status', source: 'select' }
          ],
          props: {}
        }
      ],
      pages: ['boards', 'tasks', 'calendar']
    },
    auth: {
      auth_model: 'session',
      roles: ['manager', 'member'],
      permissions: ['create_task', 'view_boards'],
      role_permissions: {
        manager: ['create_task', 'view_boards'],
        member: ['view_boards']
      },
      business_rules: []
    }
  },
  invoice: {
    app_name: 'Invoicing SaaS',
    one_line_goal: 'Automate invoice generation, tracking, and customer billing.',
    problem_statement: 'Small businesses need a reliable way to generate PDFs and track client invoice payments.',
    primary_users: ['Business Owner', 'Accountant', 'Client'],
    core_capabilities: ['Invoice Management', 'Client Directory', 'Payment Logs', 'PDF Export'],
    data_entities: [
      { name: 'clients', description: 'Stores client company profiles.', important_fields: ['id', 'name', 'email'], relationships: ['Has many invoices'] },
      { name: 'invoices', description: 'Stores financial billings.', important_fields: ['id', 'amount', 'due_date', 'status'], relationships: ['Belongs to client'] }
    ],
    workflows: [],
    ui_pages: ['dashboard', 'invoices', 'clients'],
    api_capabilities: ['Get invoices', 'Create invoice'],
    auth_requirements: [],
    non_functional_requirements: [],
    execution_constraints: [],
    assumptions: [],
    open_questions: [],
    summary: 'Billing and invoicing platform.',
    bounded_contexts: [],
    services: [],
    api_surface: [],
    ui_structure: [],
    auth_model: 'rbac',
    data_flow: [],
    risks: [],
    db: {
      tables: [
        {
          name: 'clients',
          description: 'Client companies',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'name', type: 'varchar(255)', required: true },
            { name: 'email', type: 'varchar(255)', required: true }
          ],
          primary_key: 'id',
          foreign_keys: []
        },
        {
          name: 'invoices',
          description: 'Client invoices',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'amount', type: 'integer', required: true },
            { name: 'status', type: 'varchar(50)', required: true }
          ],
          primary_key: 'id',
          foreign_keys: ['clients']
        }
      ],
      indexes: [],
      notes: []
    },
    api: {
      endpoints: [
        {
          id: 'get_clients',
          method: 'GET',
          path: '/api/clients',
          response: { ref: 'clients' },
          request_body: { fields: [] },
          auth_roles: ['owner'],
          description: 'Get client list'
        },
        {
          id: 'get_invoices',
          method: 'GET',
          path: '/api/invoices',
          response: { ref: 'invoices' },
          request_body: { fields: [] },
          auth_roles: ['owner'],
          description: 'Get invoice history'
        },
        {
          id: 'create_invoice',
          method: 'POST',
          path: '/api/invoices',
          response: { ref: 'invoices' },
          request_body: {
            fields: [
              { name: 'amount', type: 'integer', required: true },
              { name: 'status', type: 'string', required: true }
            ]
          },
          auth_roles: ['owner'],
          description: 'Create a new invoice'
        }
      ]
    },
    ui: {
      components: [
        {
          id: 'client_list',
          type: 'table',
          api_endpoint: 'GET /api/clients',
          fields: [],
          props: {}
        },
        {
          id: 'invoice_list',
          type: 'table',
          api_endpoint: 'GET /api/invoices',
          fields: [],
          props: {}
        },
        {
          id: 'invoice_form',
          type: 'form',
          api_endpoint: 'POST /api/invoices',
          fields: [
            { name: 'amount', source: 'input' },
            { name: 'status', source: 'select' }
          ],
          props: {}
        }
      ],
      pages: ['dashboard', 'invoices', 'clients']
    },
    auth: {
      auth_model: 'jwt',
      roles: ['owner', 'accountant'],
      permissions: ['billing'],
      role_permissions: { owner: ['billing'] },
      business_rules: []
    }
  },
  ecommerce: {
    app_name: 'E-Commerce Engine',
    one_line_goal: 'Enables online shopping, checkout, and inventory catalog management.',
    problem_statement: 'Need an execution-ready online storefront backend to handle products and sales.',
    primary_users: ['Shopper', 'Admin Manager'],
    core_capabilities: ['Product Listings', 'Cart Processing', 'Checkout Workflow'],
    data_entities: [
      { name: 'products', description: 'Product listings details.', important_fields: ['id', 'name', 'price'], relationships: [] },
      { name: 'orders', description: 'Sales purchases details.', important_fields: ['id', 'total_amount', 'status'], relationships: ['Contains products'] }
    ],
    workflows: [],
    ui_pages: ['products', 'orders', 'admin'],
    api_capabilities: [],
    auth_requirements: [],
    non_functional_requirements: [],
    execution_constraints: [],
    assumptions: [],
    open_questions: [],
    summary: 'Retail e-commerce solution.',
    bounded_contexts: [],
    services: [],
    api_surface: [],
    ui_structure: [],
    auth_model: 'rbac',
    data_flow: [],
    risks: [],
    db: {
      tables: [
        {
          name: 'products',
          description: 'Store inventory items',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'name', type: 'varchar(255)', required: true },
            { name: 'price', type: 'integer', required: true }
          ],
          primary_key: 'id',
          foreign_keys: []
        },
        {
          name: 'orders',
          description: 'Customer transactions',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'total_amount', type: 'integer', required: true },
            { name: 'status', type: 'varchar(50)', required: true }
          ],
          primary_key: 'id',
          foreign_keys: []
        }
      ],
      indexes: [],
      notes: []
    },
    api: {
      endpoints: [
        {
          id: 'get_products',
          method: 'GET',
          path: '/api/products',
          response: { ref: 'products' },
          request_body: { fields: [] },
          auth_roles: ['buyer', 'admin'],
          description: 'Get product list'
        },
        {
          id: 'get_orders',
          method: 'GET',
          path: '/api/orders',
          response: { ref: 'orders' },
          request_body: { fields: [] },
          auth_roles: ['admin'],
          description: 'Get all orders'
        },
        {
          id: 'create_order',
          method: 'POST',
          path: '/api/orders',
          response: { ref: 'orders' },
          request_body: {
            fields: [
              { name: 'total_amount', type: 'integer', required: true },
              { name: 'status', type: 'string', required: true }
            ]
          },
          auth_roles: ['buyer'],
          description: 'Checkout order'
        }
      ]
    },
    ui: {
      components: [
        {
          id: 'product_catalog',
          type: 'grid',
          api_endpoint: 'GET /api/products',
          fields: [],
          props: {}
        },
        {
          id: 'order_history',
          type: 'table',
          api_endpoint: 'GET /api/orders',
          fields: [],
          props: {}
        },
        {
          id: 'checkout_form',
          type: 'form',
          api_endpoint: 'POST /api/orders',
          fields: [
            { name: 'total_amount', source: 'input' },
            { name: 'status', source: 'input' }
          ],
          props: {}
        }
      ],
      pages: ['products', 'orders', 'admin']
    },
    auth: {
      auth_model: 'jwt',
      roles: ['admin', 'buyer'],
      permissions: ['checkout', 'manage_inventory'],
      role_permissions: { admin: ['manage_inventory', 'checkout'], buyer: ['checkout'] },
      business_rules: []
    }
  },
  general: {
    app_name: 'Task Manager',
    one_line_goal: 'Create, organize, and complete daily tasks and checklists.',
    problem_statement: 'Users need a lightweight workflow to record and clear tasks.',
    primary_users: ['User'],
    core_capabilities: ['Task Creation', 'Task Completion Checklist', 'Priority Filtering'],
    data_entities: [
      { name: 'todos', description: 'Todo tasks list items.', important_fields: ['id', 'title', 'completed'], relationships: [] }
    ],
    workflows: [],
    ui_pages: ['home'],
    api_capabilities: [],
    auth_requirements: [],
    non_functional_requirements: [],
    execution_constraints: [],
    assumptions: [],
    open_questions: [],
    summary: 'Generic task organizer.',
    bounded_contexts: [],
    services: [],
    api_surface: [],
    ui_structure: [],
    auth_model: 'rbac',
    data_flow: [],
    risks: [],
    db: {
      tables: [
        {
          name: 'todos',
          description: 'Task item records',
          columns: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'title', type: 'varchar(255)', required: true },
            { name: 'completed', type: 'boolean', required: true }
          ],
          primary_key: 'id',
          foreign_keys: []
        }
      ],
      indexes: [],
      notes: []
    },
    api: {
      endpoints: [
        {
          id: 'get_todos',
          method: 'GET',
          path: '/api/todos',
          response: { ref: 'todos' },
          request_body: { fields: [] },
          auth_roles: ['user'],
          description: 'Get checklist todos'
        },
        {
          id: 'create_todo',
          method: 'POST',
          path: '/api/todos',
          response: { ref: 'todos' },
          request_body: {
            fields: [
              { name: 'title', type: 'string', required: true },
              { name: 'completed', type: 'boolean', required: true }
            ]
          },
          auth_roles: ['user'],
          description: 'Create todo checklist item'
        }
      ]
    },
    ui: {
      components: [
        {
          id: 'todo_list',
          type: 'checklist',
          api_endpoint: 'GET /api/todos',
          fields: [],
          props: {}
        },
        {
          id: 'todo_form',
          type: 'form',
          api_endpoint: 'POST /api/todos',
          fields: [
            { name: 'title', source: 'input' },
            { name: 'completed', source: 'input' }
          ],
          props: {}
        }
      ],
      pages: ['home']
    },
    auth: {
      auth_model: 'session',
      roles: ['user'],
      permissions: ['manage_todos'],
      role_permissions: { user: ['manage_todos'] },
      business_rules: []
    }
  }
};

// Aliases for categories based on keyword searches
categories.job = categories.crm;
categories.hr = categories.crm;
categories.lms = categories.project;
categories.booking = categories.crm;
categories.forum = categories.project;
categories.realestate = categories.crm;
categories.notion = categories.project;
categories.social = categories.project;
categories.dashboard = categories.general;

function getCategory(systemPrompt, userMessage) {
  const sys = String(systemPrompt || '').toLowerCase();
  const user = String(userMessage || '').toLowerCase();
  
  // If it is stage 1, the userMessage is the raw user prompt.
  if (sys.includes('stage 1')) {
    if (user.includes('crm') || user.includes('lead') || user.includes('contact')) return 'crm';
    if (user.includes('project') || user.includes('trello') || user.includes('board') || user.includes('card')) return 'project';
    if (user.includes('invoice') || user.includes('billing') || user.includes('saas')) return 'invoice';
    if (user.includes('ecommerce') || user.includes('checkout') || user.includes('product') || user.includes('store') || user.includes('shop')) return 'ecommerce';
    if (user.includes('job') || user.includes('candidate') || user.includes('listing') || user.includes('ats')) return 'crm';
    if (user.includes('hr') || user.includes('employee') || user.includes('payroll') || user.includes('leave')) return 'crm';
    if (user.includes('lms') || user.includes('learning') || user.includes('course') || user.includes('lesson')) return 'project';
    if (user.includes('booking') || user.includes('appointment') || user.includes('calendar')) return 'crm';
    if (user.includes('forum') || user.includes('community') || user.includes('post') || user.includes('comment')) return 'project';
    if (user.includes('real estate') || user.includes('property') || user.includes('agent')) return 'crm';
    if (user.includes('notion')) return 'project';
    if (user.includes('social') || user.includes('chat') || user.includes('message')) return 'project';
    if (user.includes('dashboard')) return 'general';
    return 'general';
  }

  // For other stages, parse userMessage to find the context
  try {
    const payload = JSON.parse(userMessage);
    
    // 1. Check if intent/app_name is directly in the payload
    const appName = payload.app_name || (payload.intent && payload.intent.app_name) || '';
    const goal = (payload.intent && payload.intent.one_line_goal) || '';
    const combined = (appName + ' ' + goal).toLowerCase();
    
    if (combined) {
      if (combined.includes('crm') || combined.includes('sales') || combined.includes('contact')) return 'crm';
      if (combined.includes('board') || combined.includes('project') || combined.includes('trello') || combined.includes('task board')) return 'project';
      if (combined.includes('invoice') || combined.includes('billing') || combined.includes('saas')) return 'invoice';
      if (combined.includes('ecommerce') || combined.includes('store') || combined.includes('product')) return 'ecommerce';
    }

    // 2. Check table names in db/schema or response refs
    const dbTables = (payload.schema && payload.schema.db && payload.schema.db.tables) || 
                     (payload.other_schemas && payload.other_schemas.db && payload.other_schemas.db.tables) || [];
    
    const tableNames = dbTables.map(t => t.name.toLowerCase());
    if (tableNames.includes('contacts') || tableNames.includes('deals')) return 'crm';
    if (tableNames.includes('boards') || tableNames.includes('tasks')) return 'project';
    if (tableNames.includes('invoices') || tableNames.includes('clients')) return 'invoice';
    if (tableNames.includes('products') || tableNames.includes('orders')) return 'ecommerce';
    if (tableNames.includes('todos')) return 'general';
  } catch (e) {
    // ignore JSON parse errors
  }

  // Fallback: check lowercase of userMessage (excluding POST method and JSON keywords)
  const cleanedUserMsg = user
    .replace(/"method"\s*:\s*"post"/gi, '')
    .replace(/"post /gi, '')
    .replace(/post_todo/gi, '')
    .replace(/posts/gi, ''); // avoid posts forum matching
  
  if (cleanedUserMsg.includes('crm') || cleanedUserMsg.includes('lead') || cleanedUserMsg.includes('contact')) return 'crm';
  if (cleanedUserMsg.includes('project') || cleanedUserMsg.includes('trello') || cleanedUserMsg.includes('board') || cleanedUserMsg.includes('card')) return 'project';
  if (cleanedUserMsg.includes('invoice') || cleanedUserMsg.includes('billing') || cleanedUserMsg.includes('saas')) return 'invoice';
  if (cleanedUserMsg.includes('ecommerce') || cleanedUserMsg.includes('checkout') || cleanedUserMsg.includes('product') || cleanedUserMsg.includes('store') || cleanedUserMsg.includes('shop')) return 'ecommerce';
  
  return 'general';
}

function generateMock(systemPrompt, userMessage) {
  const categoryKey = getCategory(systemPrompt, userMessage);
  const data = categories[categoryKey] || categories.general;
  
  // Match the stage
  if (systemPrompt.includes('stage 1')) {
    // Intent stage
    return {
      app_name: data.app_name,
      one_line_goal: data.one_line_goal,
      problem_statement: data.problem_statement,
      primary_users: data.primary_users,
      core_capabilities: data.core_capabilities,
      data_entities: data.data_entities,
      workflows: data.workflows,
      ui_pages: data.ui_pages,
      api_capabilities: data.api_capabilities,
      auth_requirements: data.auth_requirements,
      non_functional_requirements: data.non_functional_requirements,
      execution_constraints: data.execution_constraints,
      assumptions: data.assumptions,
      open_questions: data.open_questions
    };
  }
  
  if (systemPrompt.includes('stage 2')) {
    // Architecture stage
    return {
      app_name: data.app_name,
      summary: data.summary,
      bounded_contexts: data.bounded_contexts,
      services: data.services,
      api_surface: data.api_surface,
      ui_structure: data.ui_structure,
      auth_model: data.auth_model,
      data_flow: data.data_flow,
      risks: data.risks,
      open_questions: data.open_questions
    };
  }
  
  if (systemPrompt.includes('stage 3a')) {
    // DB Schema stage
    return data.db;
  }
  
  if (systemPrompt.includes('stage 3b') && (systemPrompt.includes('API') || systemPrompt.includes('endpoint'))) {
    // API Schema stage
    return data.api;
  }
  
  if (systemPrompt.includes('stage 3b') && (systemPrompt.includes('auth') || systemPrompt.includes('business logic'))) {
    // Auth Schema stage
    return data.auth;
  }
  
  if (systemPrompt.includes('stage 3c') || systemPrompt.includes('UI schema')) {
    // UI Schema stage
    return data.ui;
  }
  
  if (systemPrompt.includes('stage 4b') || systemPrompt.includes('repair')) {
    // Repair stage: just return the current schema if present, since our mock data is 100% correct
    try {
      const parsedUserMsg = JSON.parse(userMessage);
      const targetLayer = parsedUserMsg.layer;
      if (targetLayer === 'db') return data.db;
      if (targetLayer === 'api') return data.api;
      if (targetLayer === 'ui') return data.ui;
      return parsedUserMsg.current_schema || parsedUserMsg.currentSchema || data.db;
    } catch (e) {
      return data.db; // Fallback
    }
  }
  
  // Generic fallback if unknown stage
  return data;
}

module.exports = {
  generateMock,
  getCategory
};
