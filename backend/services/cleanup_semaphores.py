import multiprocessing
import atexit

def cleanup_resources():
    """Clean up multiprocessing resources to prevent leaked semaphores"""
    if hasattr(multiprocessing, 'resource_tracker'):
        if hasattr(multiprocessing.resource_tracker, '_resource_tracker'):
            if hasattr(multiprocessing.resource_tracker._resource_tracker, 'clear'):
                multiprocessing.resource_tracker._resource_tracker.clear()
            elif hasattr(multiprocessing.resource_tracker._resource_tracker, '_semaphore_tracker'):
                if hasattr(multiprocessing.resource_tracker._resource_tracker._semaphore_tracker, '_cleanup'):
                    multiprocessing.resource_tracker._resource_tracker._semaphore_tracker._cleanup()

# Register cleanup function to run at exit
atexit.register(cleanup_resources)
